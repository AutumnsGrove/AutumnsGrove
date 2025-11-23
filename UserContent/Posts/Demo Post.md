---
title: Creating Beautiful Blog Posts
date: 2025-11-22
description: A comprehensive guide to writing engaging blog posts with gutter content, featuring Willow the dog
tags:
  - guide
  - tutorial
  - demo
---

Welcome to this guide on creating beautiful, engaging blog posts! This demo will teach you everything you need to know about writing great content and using the gutter system effectively. Along the way, you'll meet Willow, our resident good dog who helps demonstrate these features.

## Introduction

This post serves as both a tutorial and a living example. The left gutter contains comments, notes, and photos that complement the main content. The right gutter shows the table of contents for easy navigation.

As you read through, pay attention to how gutter items are positioned alongside their relevant sections. This creates a rich, layered reading experience that's perfect for tutorials, documentation, or any content that benefits from supplementary material.

The gutter system is incredibly flexible. You can add author notes, provide additional context, showcase images, or create galleries—all without cluttering your main content flow.

## Getting Started with Blog Posts

Creating a new blog post is straightforward. Each post is a Markdown file in the `posts` directory with frontmatter that defines its metadata.

Here's what a basic frontmatter looks like:

```yaml
---
title: Your Post Title
date: 2025-01-15
description: A brief summary of your post
tags:
  - tag1
  - tag2
---
```

The `title` appears as the main heading on your post page. The `date` determines sorting order and is displayed below the title. The `description` appears in post previews and search results. Tags help readers find related content.

After the frontmatter, you write your content in standard Markdown. You have access to all the usual formatting options: **bold text**, *italics*, `inline code`, links, lists, blockquotes, and more.

### File Structure

Your post's file name becomes its URL slug. For example, `My Great Post.md` becomes `/blog/my-great-post`. Keep file names descriptive but concise.

If you want to add gutter content to your post, create a subdirectory with the same name as your post (without the `.md` extension). Inside that directory, create a `gutter` folder containing your gutter files and a `manifest.json` that defines your gutter items.

## Writing Engaging Content

Great blog posts share a few key characteristics: they're well-organized, easy to scan, and provide value to readers. Let's explore some techniques for achieving these goals.

### Use Clear Headings

Break your content into logical sections with descriptive headings. Readers often scan posts before deciding to read in detail. Clear headings help them understand your content structure at a glance.

Each heading should accurately describe the section that follows. Avoid clever or vague titles—clarity trumps creativity in navigation.

### Keep Paragraphs Focused

Each paragraph should explore a single idea or concept. If you find yourself covering multiple topics in one paragraph, consider splitting it up.

Short paragraphs are easier to read on screens. They create visual breathing room and help maintain reader attention. Aim for 3-5 sentences per paragraph as a general guideline.

### Show, Don't Just Tell

Whenever possible, provide concrete examples. Abstract concepts become much clearer when illustrated with real-world applications.

For instance, instead of saying "use descriptive variable names," you might show:

```javascript
// Unclear
const d = new Date();
const n = d.getDay();

// Clear
const currentDate = new Date();
const dayOfWeek = currentDate.getDay();
```

Examples like this make your content immediately actionable. Readers can see exactly what you mean and apply the technique themselves.

## About Willow

Now let's take a break from the technical content to introduce Willow, our demonstration assistant. Willow is a very good dog who loves to help with tutorials.

Willow is a mixed breed with the most soulful eyes you've ever seen. She's always ready to pose for photos, especially if there might be treats involved. Her hobbies include napping in sunbeams, going for walks, and convincing humans that she hasn't been fed yet.

She's the perfect example subject because she's photogenic and endlessly patient. Plus, everyone loves dogs, so she makes our tutorials more engaging.

<!-- anchor:willow-fact -->

Fun fact: dogs can learn to understand over 100 words and gestures! Willow definitely knows "walk," "treat," and "dinner," and she pretends not to know "bath" and "bedtime."

When writing your own posts, consider using consistent example subjects or themes. This creates continuity across your content and helps readers feel familiar with your style.

## Using the Left Gutter

The left gutter is perfect for supplementary content that enhances but doesn't interrupt your main narrative. Think of it as a margin where you can add notes, context, or visual elements.

### Types of Gutter Content

There are several types of content you can add to your gutter:

**Comments**: These are Markdown-formatted notes that appear alongside your content. Use them for author asides, additional context, historical notes, or tips that don't fit in the main flow.

**Photos**: Single images with optional captions. Great for showing examples, diagrams, or adding visual interest.

**Galleries**: Multiple images that readers can navigate through. Perfect for step-by-step visuals, before/after comparisons, or showcasing a collection.

### When to Use Gutter Content

Gutter content works best when it:

- Provides additional context without interrupting the main flow
- Offers optional deep-dives for interested readers
- Adds visual interest that complements the text
- Supplies reference information that some readers may need

Avoid overusing gutter content. Too many items can overwhelm readers and create positioning issues. Choose your gutter items carefully for maximum impact.

## Adding Images to Your Posts

<!-- anchor:image-tips -->

Images make your posts more engaging and help illustrate concepts that are hard to explain with words alone. The gutter system gives you flexible options for including images.

### Single Images

For individual images, use the `photo` type in your manifest. You can provide a caption that appears below the image:

```json
{
  "type": "photo",
  "file": "willow-walk.jpg",
  "anchor": "## Section Name",
  "caption": "Willow enjoying her favorite trail"
}
```

Images in the gutter are displayed at a reasonable size that fits the gutter width. They're automatically responsive and will adjust for different screen sizes.

### Best Practices for Images

Keep these tips in mind when adding images:

1. **Optimize file sizes**: Large images slow down page loads. Compress your images or use optimized formats like WebP.

2. **Use descriptive alt text**: This helps with accessibility and provides context if images fail to load.

3. **Write meaningful captions**: A good caption adds information that isn't obvious from the image itself.

4. **Consider aspect ratio**: Very wide or very tall images may not display well in the narrow gutter column.

## Creating Image Galleries

When you have multiple related images, a gallery is more elegant than separate photos. Galleries let readers browse through images with navigation controls.

### Gallery Configuration

Here's how to define a gallery in your manifest:

```json
{
  "type": "gallery",
  "anchor": "## Gallery Section",
  "images": [
    {
      "url": "image1.jpg",
      "alt": "Description of first image",
      "caption": "Caption for first image"
    },
    {
      "url": "image2.jpg",
      "alt": "Description of second image",
      "caption": "Caption for second image"
    }
  ]
}
```

Each image in the gallery has its own alt text and caption. The reader can navigate between images using arrow buttons or swipe gestures on mobile.

### When to Use Galleries

Galleries are ideal for:

- Step-by-step tutorials where each image shows a different step
- Comparison sets (before/after, different options)
- Collections of related items
- Multiple angles or views of the same subject

Keep gallery sizes reasonable—3 to 6 images works well. Very large galleries can feel tedious to navigate.

## Understanding Anchor Types

<!-- anchor:anchor-types -->

Anchors determine where your gutter items appear relative to your content. There are three types of anchors, each suited to different needs.

### Header-Based Anchors

The most common anchor type references a heading in your content:

```json
"anchor": "## Introduction"
```

The gutter item will appear aligned with that heading. Use this when your supplementary content relates to an entire section.

Make sure the header text matches exactly, including the number of `#` symbols. If your heading is `### Subsection`, use `"anchor": "### Subsection"`.

### Paragraph-Based Anchors

For more precise positioning, you can anchor to a specific paragraph:

```json
"anchor": "paragraph:3"
```

This anchors to the third direct paragraph in your content (counting starts at 1). Paragraphs inside blockquotes or lists don't count—only top-level `<p>` elements.

Use this when you want to align a gutter item with specific content that doesn't have its own heading.

### Tag-Based Anchors

The most flexible option is tag-based anchoring. First, add an HTML comment in your Markdown:

```markdown
<!-- anchor:mytagname -->

Content that follows the anchor...
```

Then reference it in your manifest:

```json
"anchor": "anchor:mytagname"
```

This gives you pixel-precise control over positioning. The gutter item appears exactly where you placed the anchor tag.

## Best Practices for Gutter Content

To create posts with great gutter experiences, follow these guidelines:

### Space Out Your Items

The most common issue with gutter content is items getting pushed down or overflowing. This happens when items are anchored too close together.

Each gutter item needs vertical space. If you anchor multiple items to adjacent paragraphs or headings, they'll collide and push each other down. The last items may overflow past your content.

**Solution**: Ensure there's substantial content between anchors. As a rule of thumb, leave at least 3-4 paragraphs between gutter items.

### Consider Item Heights

Different item types take different amounts of space:

- Short comments: ~80-100 pixels
- Longer comments: 150-200+ pixels
- Single images: ~180-220 pixels
- Galleries: ~250-300 pixels

Plan your content length accordingly. A post with 6 gutter items needs enough main content to accommodate them all.

### Put Large Items Early

Galleries and image-heavy content should anchor to earlier sections when possible. This gives them more room and reduces the chance of overflow.

If you have a gallery, don't anchor it to your conclusion. By then, there's no content below to prevent overflow.

### Test Different Screen Sizes

Gutter positioning is responsive. Items may appear differently on various screen sizes:

- On wide screens (1200px+), you see both left and right gutters
- On medium screens (769-1199px), only the right gutter shows
- On mobile, gutter items appear inline within the content

Preview your post at different sizes to ensure it looks good everywhere.

## Handling Overflow

Sometimes gutter items will overflow past your content, especially if your post is shorter or has many gutter items. The system handles this gracefully with reference markers.

When an item overflows, a small reference number appears in your content where the item was supposed to be (like this: ¹). Clicking it scrolls to the overflow section at the bottom of the post, where all overflowing items are displayed.

This ensures readers can always access your gutter content, even when it can't be positioned in the margin. It's similar to how footnotes work in academic papers.

To minimize overflow:

1. Write longer, more detailed content
2. Use fewer gutter items
3. Space anchors further apart
4. Avoid putting large items at the end

That said, some overflow is acceptable. The reference system makes it unobtrusive.

## Mobile Considerations

On mobile devices and narrow screens, the left gutter isn't visible—there simply isn't room. Instead, gutter items appear inline within your content, positioned after their anchor elements.

This means your gutter content should make sense in both contexts:

- In the gutter: appearing alongside related content
- Inline: appearing between content sections

Write gutter content that works well in either layout. Avoid references like "see the sidebar" since there's no sidebar on mobile.

The inline mobile layout actually has benefits—it ensures all readers see your supplementary content rather than possibly missing it in a side gutter.

## Conclusion

You now have everything you need to create beautiful, engaging blog posts with rich gutter content. Let's recap the key points:

1. **Write substantial content** with clear headings and focused paragraphs
2. **Use gutter items thoughtfully** for supplementary material that enhances the main content
3. **Choose appropriate anchor types** based on how precisely you need to position items
4. **Space out your gutter items** to avoid collision and overflow issues
5. **Test across screen sizes** to ensure your post looks good everywhere

The gutter system is a powerful tool for creating layered, engaging content. Like any tool, it works best when used with intention. Not every post needs gutter content, and not every piece of information belongs in the gutter.

When you do use it well, though, the results are fantastic. Your readers get a richer experience with optional deep-dives and visual interest, all while maintaining a clean main content flow.

Now go create something great! And remember—if Willow can learn to pose for photos, you can learn to write excellent blog posts.

Happy writing!
