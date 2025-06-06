
export interface Article {
	
	url: string;
	title: string;
	description: string;
	imageUrl? : string; // Optional image url
}

export interface Agenda {
	
	id: string;
	title: string;
	createdAt: Date;
	articles: Article[]; //List of articles
}
