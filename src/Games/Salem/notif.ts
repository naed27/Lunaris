interface ConstructorParams{
    newsForSpy?: string;
    newsForLookOut?: string;
    inbox?: string;
}

export default class Notif{

    inbox: string | null;
    newsForSpy: string | null;
    newsForLookout: string | null;

    constructor({ newsForSpy = null, newsForLookOut = null, inbox = null }: ConstructorParams){
        this.inbox = inbox;
        this.newsForSpy = newsForSpy;
        this.newsForLookout = newsForLookOut;
    }

    // ------------------------------------- SETTERS AND GETTERS

    getInbox = () => this.inbox
    getNewsForSpy = () => this.newsForSpy
    getNewsForLookout = () => this.newsForLookout

    setInbox = (a: string) => this.inbox = a
    setNewsForSpy = (a: string) => this.newsForSpy = a
    setNewsForLooukout = (a: string) => this.newsForLookout = a

}