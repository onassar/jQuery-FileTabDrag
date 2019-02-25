# jQuery File and Tab Drag
jQuery plugin which exposes custom events which you can listen to to detect files being dragged to an `HTMLElement`, or images from another browser tab

### Example
``` javascript
$('body').listenForFileAndTabDrag();
$('body').on({

    // Drop events
    'custom/drag/drop': function(event) {
        console.log(event);
    },
    'custom/drag/drop/files': function(event, files) {
        console.log(files);
    },
    'custom/drag/drop/tab': function(event, imageURL) {
        console.log(imageURL);
    },

    // Enter events
    'custom/drag/enter': function(event) {
        console.log(event);
    },
    'custom/drag/enter/files': function(event) {
        console.log(event);
    },
    'custom/drag/enter/tab': function(event) {
        console.log(event);
    },

    // Leave/over events
    'custom/drag/leave': function(event) {
        console.log(event);
    },
    'custom/drag/over': function(event) {
        console.log(event);
    }
});
```
