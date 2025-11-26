// controllers/predictController.js
const { getModelInfo, predict } = require("../services/tfModelService");
const { Prediction, hash_array } = require("../database/predictDatabase");

function health(req, res) {
    res.json({
        status: "ok",
        service: "predict"
    });
}

function ready(req, res) {
    const info = getModelInfo();

    if (!info.ready) {
        return res.status(503).json({
            ready: false,
            modelVersion: info.modelVersion,
            message: "Model is still loading"
        });
    }

    res.json({
        ready: true,
        modelVersion: info.modelVersion
    });
}

async function doPredict(req, res) {
    try {
        const start = Date.now();

        const info = getModelInfo();
        if (!info.ready) {
            return res.status(503).json({
                error: "Model not ready",
                ready: false
            });
        }

        const { features, meta } = req.body;

        if (!features) {
            return res.status(400).json({ error: "Missing features" });
        }
        if (!meta || typeof meta !== "object") {
            return res.status(400).json({ error: "Missing meta object" });
        }

        const { featureCount } = meta;

        if (featureCount !== info.inputDim) {
            return res.status(400).json({
                error: `featureCount must be ${info.inputDim}, received ${featureCount}`
            });
        }

        if (!Array.isArray(features) || features.length !== info.inputDim) {
            return res.status(400).json({
                error: `features must be an array of ${info.inputDim} numbers`
            });
        }

        let cacheHit;
        let prediction;
        const predictionId = hash_array(features);

        await Prediction.findById(predictionId)
            .then(predictionData => {
                cacheHit = true;
                prediction = predictionData.prediction;
                console.log('[RT] Cache hit')
            })
            .catch(async _ => {
                cacheHit = false;
                prediction = await predict(features);
                console.log('[RT] Cache miss')
            })

        const latencyMs = Date.now() - start;
        const timestamp = new Date().toISOString();

        let predictionSaved = false;

        if (!cacheHit) {
            let predictionEntry = new Prediction({
                _id: predictionId,
                prediction,
                source: meta.source,
                correlationId: meta.correlationId
            });

            predictionSaved = await predictionEntry.save();
        }

        res.status((cacheHit || predictionSaved) ? 200 : 201).json({
            predictionId,
            prediction,
            timestamp,
            latencyMs,
            cache: cacheHit ? 'HIT' : 'MISS'
        });
    } catch (err) {
        console.error("Error en /predict:", err);
        res.status(500).json({ error: "Internal error" });
    }
}

module.exports = {
    health,
    ready,
    doPredict
};
