
/**
 * jQuery File and Tag Drag
 * 
 * @author  Oliver Nassar <oliver@getstencil.com>
 * @link    https://github.com/getstencil/jQuery-FileTabDrag
 * @example
 *          $('body').on({
 *              'custom/drag/drop/files': function(event, files) {
 *              }
 *          });
 */
(function($) {

    /**
     * __contains
     * 
     * @access  private
     * @param   mixed value
     * @param   Array arr
     * @return  Boolean
     */
    var __contains = function(value, arr) {
        var index = $.inArray(value, arr);
        return index !== -1;
    };

    /**
     * __getTabTransferImageUri
     * 
     * @note    Screenshot linked to below is reference to issues with page
     *          trying to automatically load local file.
     * @see     https://stackoverflow.com/questions/37985193/how-can-i-read-an-image-if-it-was-dragged-from-another-tab
     * @see     https://i.imgur.com/NNw9JRf.png
     * @see     https://i.imgur.com/pJWQmHk.png
     * @see     https://i.imgur.com/iSAcaZZ.png
     * @access  public
     * @param   Object event
     * @return  false|String
     */
    var __getTabTransferImageUri = function(event) {
        var dataTransfer = event.originalEvent.dataTransfer,
            files = dataTransfer.files;
        if (files.length > 0) {
            return false;
        }
        var data = dataTransfer.getData('text/html').trim();
        if (data === '') {
            return false;
        }
        if (data.match(/"file\:\/\//i) !== null) {
            return false;
        }
        var $elements = $(data),
            $img;
        if ($elements.find('img').length > 0) {
            $img = $elements.find('img').first();
        } else if($elements.filter('img').length > 0) {
            $img = $elements.filter('img').first();
        } else {
            return false;
        }
        if ($img.length === 0) {
            return false;
        }
        if($img.is('img') === false) {
            return false;
        }
        var src = $img.attr('src'),
            local = src.match(/^file\:\/\//i) !== null;
        if (local === true) {
            return false;
        }
        return src;
    };

    /**
     * __isFileDrag
     * 
     * @see     https://sentry.io/stencil/javascript/issues/573179290/?environment=prod
     *          https://i.imgur.com/JnYywfe.png
     * @access  protected
     * @param   jQuery event
     * @return  Boolean
     */
    var __isFileDrag = function(event) {
        if (event === undefined || event === null) {
            return false;
        }
        var originalEvent = event.originalEvent;
        if (originalEvent === undefined || originalEvent === null) {
            return false;
        }
        var dataTransfer = originalEvent.dataTransfer;
        if (dataTransfer === undefined || dataTransfer === null) {
            return false;
        }
        var types = dataTransfer.types;
        if (types === undefined || types === null) {
            return false;
        }
        var index, type;
        for (index in types) {
            type = types[index];
            if (type.toLowerCase === undefined || type.toLowerCase === null) {
                continue;
            }
            if (type.toLowerCase() === 'files') {
                return true;
            }
        }
        return false;
    };

    /**
     * __isTabDrag
     * 
     * @note    The false returned within the image/tiff check below is because
     *          Safari doesn't yet support this. Specifically, although I can
     *          detect whether it's a Safari drag, Safari doesn't seem to
     *          support the getData call to get the actual content.
     * @see     https://stackoverflow.com/questions/37985193/how-can-i-read-an-image-if-it-was-dragged-from-another-tab
     * @access  private
     * @param   jQuery event
     * @return  Boolean
     */
    var __isTabDrag = function(event) {
        var originalEvent = event.originalEvent;
        if (originalEvent === undefined || originalEvent === null) {
            return false;
        }
        var dataTransfer = originalEvent.dataTransfer;
        if (dataTransfer === undefined || dataTransfer === null) {
            return false;
        }
        var files = dataTransfer.files;
        if (files === undefined || files === null) {
            return false;
        }
        if (files.length > 0) {
            return false;
        }
        var types = [],
            index;
        for (index in dataTransfer.types) {
            types.push(dataTransfer.types[index]);
        }
        if (__contains('application/x-moz-nativeimage', types) === true) {
            return true;
        }
        if (__contains('image/tiff', types) === true) {
            return false;
            return true;
        }
        if (types.length !== 2) {
            return false;
        }
        if (__contains('text/html', types) === false) {
            return false;
        }
        if (__contains('text/uri-list', types) === false) {
            return false;
        }
        return true;
    };

    /**
     * __processDrop
     * 
     * @note    The order of the condtionals below is important, because a tab
     *          drag currently will always pass the file drag check (but not
     *          vice-versa).
     * @access  private
     * @param   jQuery event
     * @param   jQuery $element
     * @return  void
     */
    var __processDrop = function(event, $element) {
        if (__isFileDrag(event) === true) {
            __processFileDrop(event, $element);
        } else if (__isTabDrag(event) === true) {
            __processTabDrop(event, $element);
        }
    };

    /**
     * __processEnter
     * 
     * @note    The order of the condtionals below is important, because a tab
     *          drag currently will always pass the file drag check (but not
     *          vice-versa).
     * @access  private
     * @param   jQuery event
     * @param   jQuery $element
     * @return  void
     */
    var __processEnter = function(event, $element) {
        if (__isFileDrag(event) === true) {
            __processFileEnter(event, $element);
        } else if (__isTabDrag(event) === true) {
            __processTabEnter(event, $element);
        }
    };

    /**
     * __processFileDrop
     * 
     * @access  private
     * @param   jQuery event
     * @param   jQuery $element
     * @return  void
     */
    var __processFileDrop = function(event, $element) {
        var files = event.originalEvent.dataTransfer.files,
            eventType = 'custom/drag/drop/files';
        $element.triggerHandler(eventType, [files]);
    };

    /**
     * __processFileEnter
     * 
     * @access  private
     * @param   jQuery event
     * @param   jQuery $element
     * @return  void
     */
    var __processFileEnter = function(event, $element) {
        var eventType = 'custom/drag/enter/files';
        $element.triggerHandler(eventType);
    };

    /**
     * __processTabDrop
     * 
     * @access  private
     * @param   jQuery event
     * @param   jQuery $element
     * @return  void
     */
    var __processTabDrop = function(event, $element) {
        var imageUrl = __getTabTransferImageUri(event);
        if (imageUrl !== false) {
            var eventType = 'custom/drag/drop/tab';
            $element.triggerHandler(eventType, [imageUrl]);
        }
    };

    /**
     * __processTabEnter
     * 
     * @access  private
     * @param   jQuery event
     * @param   jQuery $element
     * @return  void
     */
    var __processTabEnter = function(event, $element) {
        var eventType = 'custom/drag/enter/tab';
        $element.triggerHandler(eventType);
    };

    /**
     * __setupListeners
     * 
     * @access  private
     * @param   jQuery $element
     * @return  void
     */
    var __setupListeners = function($element) {
        $element.on({
            'dragenter': function(event) {
                event.preventDefault();
                event.stopPropagation();
                var eventType = 'custom/drag/enter';
                $element.triggerHandler(eventType);
                __processEnter(event, $element);
            },
            'dragleave': function(event) {
                var eventType = 'custom/drag/leave';
                $element.triggerHandler(eventType);
            },
            'dragover': function(event) {
                event.preventDefault();
                event.stopPropagation();
                var eventType = 'custom/drag/over';
                $element.triggerHandler(eventType);
            },
            'drop': function(event) {
                event.preventDefault();
                event.stopPropagation();
                var eventType = 'custom/drag/drop';
                $element.triggerHandler(eventType);
                __processDrop(event, $element);
                eventType = 'custom/drag/leave';
                $element.triggerHandler(eventType);
            }
        });
    };

    /**
     * __construct
     * 
     * Operates as the constructor by calling the private __setupListeners
     * function, and returning itself to allow for chaining.
     */
    $.fn.listenForFileAndTabDrag = function() {
        __setupListeners(this);
        return this;
    };
})(jQuery);
