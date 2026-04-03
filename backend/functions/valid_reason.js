
const reasons = [
    "Violence or abuse",
    "Suicide or self-harm",
    "Bullying, harassment, or hateful speech",
    "Fraud, scam, or misinformation",
    "Sexual Content",
    "Promoting illegal activities or items",
]


//check if reason is in our array of report reasons
//ensures frontend-backend consistency and API protections
function valid_reason(reason) {
    //if invalid type because we don't have type hints in js
    if (typeof reason !== 'string') {
        return false;
    }

    //returns true if is in valid reason array and false if not
    return reasons.includes(reason)
}

module.exports={ valid_reason }