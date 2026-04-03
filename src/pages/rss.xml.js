import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";
import { sortPosts } from "../utils/content";

export async function GET(context) {
	const posts = sortPosts(await getCollection("blog"));
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => ({
			title: post.data.title,
			description: post.data.description,
			pubDate: post.data.pubDate,
			link: `/blog/${post.id}/`,
		})),
		customData: `<language>en-us</language>`,
	});
}
