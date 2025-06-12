
export interface Article {
	
	id: string;
	title: string;
	url: string;
	description: string;
	image?: string;
}

export interface Agenda {
	
	id: string;
	title: string;
	createdAt: Date;
	articles: Article[]; //List of articles
}
