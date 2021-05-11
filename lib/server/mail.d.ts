export default class MailManager {
    transporter: any;
    mailOptions: any;
    service: any;
    constructor({ client, service }: {
        client: any;
        service: any;
    });
    isConnected(): Promise<boolean>;
    sendMail({ text, subject, to, replyTo }: {
        text: any;
        subject: any;
        to: any;
        replyTo?: any;
    }): Promise<boolean>;
}
