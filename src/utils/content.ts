import type { CollectionEntry } from "astro:content";

export function sortPosts(posts: CollectionEntry<"blog">[]) {
	return posts
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function estimateReadingMinutes(text: string) {
	const words = text.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(words / 220));
}

export function slugify(value: string) {
	return value
		.toLowerCase()
		.trim()
		.replace(/&/g, " and ")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function unslugify(value: string) {
	return value
		.split("-")
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

export function categoryPath(category: string) {
	return `/categories/${slugify(category)}/`;
}

export function tagPath(tag: string) {
	return `/tags/${slugify(tag)}/`;
}

export function getRelatedPosts(
	currentPost: CollectionEntry<"blog">,
	posts: CollectionEntry<"blog">[],
	limit = 3,
) {
	return posts
		.filter((post) => post.id !== currentPost.id)
		.map((post) => {
			const sharedTags = post.data.tags.filter((tag) => currentPost.data.tags.includes(tag)).length;
			const categoryMatch = post.data.category === currentPost.data.category ? 3 : 0;
			return {
				post,
				score: categoryMatch + sharedTags,
			};
		})
		.sort((a, b) => b.score - a.score || b.post.data.pubDate.valueOf() - a.post.data.pubDate.valueOf())
		.slice(0, limit)
		.map(({ post }) => post);
}
