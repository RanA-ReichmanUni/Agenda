
export interface Article {
	
	url: string;
	title: string;
	description: string;
	imageUrl? : string; // Optional image url


export interface Agenda {
	
	id: string;
	title: string;
	createAt: Date;
	articles: Article[]; //List of articles
}
