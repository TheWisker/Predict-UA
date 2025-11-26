const mongoose = require('mongoose');
const Schema = mongoose.Schema;

mongoose.connect('mongodb://localhost:27017/predictor')
    .then(() => { console.log('[SB] Conexion a la BBDD establecida'); })
    .catch(err => {
        console.error('Error al conectarse a la BBDD:', err);
        process.exit(1);
    });

const PredictorSchema = new Schema({
    _id: { type: String, required: true },
    prediction: { type: Number, required: true },
    correlationId: String,
    source: String
});

function hash_array(arr) {
    return arr
        .map(n =>
            n.toString()
                .replace(/\./g, "O")
                .replace(/-/g, "M")
        ).join("J");
  }

module.exports = {
    hash_array,
    Prediction: mongoose.model('Prediction', PredictorSchema)
};