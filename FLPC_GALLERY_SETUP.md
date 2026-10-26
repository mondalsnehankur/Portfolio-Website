# Add your FLPC training photographs

The FLPC achievement opens a gallery with three editable filename placeholders already in `index.html`.

1. Put your images in this same folder (beside `index.html`).
2. Name them `pic1.jpg`, `pic2.jpg`, and `pic3.jpg`, **or** change the `src` values in the `flpcPhotos` array to the filenames/URLs you want to use. PNG is fine too; just update the extension.
3. Edit each `alt` and `caption` so they describe the actual photograph.
4. Open the site and click the FLPC achievement. Thumbnails and the large preview, previous/next buttons, and close action are wired up already.

Example entry:

```js
{ src: 'pic1.jpg', alt: 'Participants working together during FLPC training', caption: 'Team activity during the workshop' }
```

Keep image files beside `index.html` if using relative filenames. Use descriptive alt text and only publish photos you have permission to share.
