
const reasons = [
    "Violence or abuse",
    "Suicide or self-harm",
    "Bullying, harassment, or hateful speech",
    "Fraud, scam, or misinformation",
    "Spam Content",
    "Sexual Content",
    "Promoting illegal activities or items",
    "Intellectual property infringement",
]

const userReasons = [
    "Inappropriate username, profile picture, or bio",
    "Pretending to be someone else or fake profile",
    "Sharing private information",
]


//check if reason is in our array of report reasons
//ensures frontend-backend consistency and API protections
function validReason(reason) {
    //if invalid type because we don't have type hints in js
    if (typeof reason !== 'string') {
        return false;
    }

    //returns true if is in valid reason array and false if not
    return reasons.includes(reason)
}

//check if reason for user report is valid
//api protection & consistency
function validUserReason(reason) {
    //check type is string
    if (typeof reason !== 'string') {
        return false;
    }

    console.log(reason)

    return userReasons.includes(reason)
}

module.exports={ validReason, validUserReason }