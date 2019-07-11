const sgMail = require('@sendgrid/mail')


sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ron@dontbethatbro.com',
        subject: 'Thanks for joining in.',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'ron@dontbethatbro.com',
        subject: 'Sorry to see you go.',
        text: `We're sorry to see you go ${name}. If you ever want to come back we'll be here.`
    })
}
module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}