# jQuery File and Tab Drag
jQuery plugin which exposes custom events which you can listen to to detect files being dragged to an `HTMLElement`, or images from another browser tab

### Example
``` javascript
$('body').on({,
    'custom/drag/drop/files': function(event, files) {
        console.log(files);
    },
    'custom/drag/drop/tab': function(event, imageUrl) {
        console.log(imageUrl);
    }
});
```
