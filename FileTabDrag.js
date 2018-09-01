
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
 * @see     https://stackoverflow.com/questions/12105900/fileentry-file-method-makes-datatransferitemlist-empty
 * @see     https://developers.google.com/web/updates/2012/07/Drag-and-drop-a-folder-onto-Chrome-now-available
 * @see     https://caniuse.com/#search=webkitDirectory
 * @see     https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem/webkitGetAsEntry
 * @see     https://stackoverflow.com/questions/11477412/html5-drag-and-drop-items-webkitgetasentry-method-doesnt-exist/11478372
 * @see     https://stackoverflow.com/questions/5826286/how-do-i-use-google-chrome-11s-upload-folder-feature-in-my-own-code?lq=1
 * @see     https://stackoverflow.com/questions/3590058/does-html5-allow-drag-drop-upload-of-folders-or-a-folder-tree
 * @see     https://stackoverflow.com/questions/8856628/detecting-folders-directories-in-javascript-filelist-objects
 * @see     https://developer.mozilla.org/en-US/docs/Web/API/FileSystemEntry/isDirectory
 * @see     https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries
 * @see     https://stackoverflow.com/questions/45052875/how-to-convert-fileentry-to-standard-javascript-file-object-using-chrome-apps-fi
 */
(function($) {

    /**
     * __allowDirectoryDropping
     * 
     * @access  private
     * @return  Boolean (default: true)
     */
    var __allowDirectoryDropping = true;

    /**
     * __filenamesToIgnore
     * 
     * @access  private
     * @return  Array
     */
    var __filenamesToIgnore = [
        '.DS_Store',
        '.git',
        '.gitignore',
        '.gitmodules',
        '.htaccess',
        '.svn'
    ];

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
     * __containsDirectories
     * 
     * @access  private
     * @param   jQuery event
     * @return  Boolean
     */
    var __containsDirectories = function(event) {
        if (__supportsDirectories() === false) {
            return false;
        }
        var items = event.originalEvent.dataTransfer.items,
            length = items.length,
            item;
        for (var i = 0; i < length; i++) {
            var item = items[i];
            if (__validValue(item.webkitGetAsEntry) === false) {
                return false;
            }
            var entry = item.webkitGetAsEntry();
            if (__validValue(entry.isDirectory) === false) {
                return false;
            }
            if (entry.isDirectory === true) {
                return true;
            }
        }
        return false;
    };

    /**
     * __convertDataTransferItemsToFiles
     * 
     * @access  private
     * @param   jQuery event
     * @param   Function callback
     * @return  void
     */
    var __convertDataTransferItemsToFiles = function(event, callback) {
        var items = event.originalEvent.dataTransfer.items,
            entries = [],
            entry;
        for (var x = 0; x < items.length; x++) {
            entry = items[x].webkitGetAsEntry();
            entries.push(entry);
        }
        __convertEntriesToFiles(entries, callback);
    };

    /**
     * __convertDirectoryEntryToFiles
     * 
     * @see     https://github.com/enyo/dropzone/issues/599
     * @see     https://developer.mozilla.org/en-US/docs/Web/API/FileSystemDirectoryReader/readEntries
     * @access  private
     * @param   DirectoryEntry|FileSystemDirectoryEntry directoryEntry
     * @param   Function callback
     * @param   undefined|Array files (default: [])
     * @param   undefined|DirectoryReader reader (default: directoryEntry.createReader())
     * @return  void
     */
    var __convertDirectoryEntryToFiles = function(directoryEntry, callback, entries, reader) {
        entries = entries || [];
        reader = reader || directoryEntry.createReader();
        reader.readEntries(function(readEntries) {
            if (readEntries.length === 0) {
                __sortEntriesByName(entries);
                __convertEntriesToFiles(entries, callback);
            } else {
                entries = entries.concat(readEntries);
                __convertDirectoryEntryToFiles(directoryEntry, callback, entries, reader);
            }
        });
    };

    /**
     * __convertEntriesToFiles
     * 
     * @access  private
     * @param   Array entries
     * @param   Function callback
     * @param   undefined|Number index (default: 0)
     * @param   undefined|Array files (default: [])
     * @return  void
     */
    var __convertEntriesToFiles = function(entries, callback, index, files) {
        index = index || 0;
        files = files || [];
        if (index === entries.length) {
            callback(files);
        } else {
            var entry = entries[index];
            if (entry.isFile === true) {
                __convertFileEntryToFile(entry, function(file) {
                    if (__ignoreFile(file) === false) {
                        files.push(file);
                    }
                    __convertEntriesToFiles(entries, callback, index + 1, files);
                });
            } else {
                __convertDirectoryEntryToFiles(entry, function(convertedFiles) {
                    files = files.concat(convertedFiles);
                    __convertEntriesToFiles(entries, callback, index + 1, files);
                });
            }
        }
    };

    /**
     * __convertFileEntryToFile
     * 
     * @access  private
     * @param   FileEntry|FileSystemEntry fileEntry
     * @param   Function callback
     * @return  void
     */
    var __convertFileEntryToFile = function(fileEntry, callback) {
        fileEntry.file(function(file) {
            callback(file);
        });
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
     * @note    The $(data) code below can have some unexpected behaviour. For
     *          example: in cases where the image tag might have an src or
     *          set value that is relative
     *          (eg. here: https://i.imgur.com/2ejEl1u.png) a request may be
     *          made to yourdomain.com/$srcset-path because your browser (more
     *          specifically, jQuery and the DOM) is trying to load the img
     *          element and all it's related attribute values. So this means
     *          your server log may contain arbitrary requests unrelated to your
     *          app, which may just be attribute values of images (from other
     *          tabs or windows) that are being dragged in.
     * @access  private
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
     * __ignoreFile
     * 
     * @access  private
     * @param   File file
     * @return  Boolean
     */
    var __ignoreFile = function(file) {
        var ignore = __contains(file.name, __filenamesToIgnore);
        return ignore;
    };

    /**
     * __isFileDrag
     * 
     * @see     https://sentry.io/stencil/javascript/issues/573179290/?environment=prod
     *          https://i.imgur.com/JnYywfe.png
     * @access  private
     * @param   jQuery event
     * @return  Boolean
     */
    var __isFileDrag = function(event) {
        if (__validValue(event) === false) {
            return false;
        }
        var originalEvent = event.originalEvent;
        if (__validValue(originalEvent) === false) {
            return false;
        }
        var dataTransfer = originalEvent.dataTransfer;
        if (__validValue(dataTransfer) === false) {
            return false;
        }
        var types = dataTransfer.types;
        if (__validValue(types) === false) {
            return false;
        }
        var index, type;
        for (index in types) {
            type = types[index];
            if (__validValue(type.toLowerCase) === false) {
                return false;
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
        if (__validValue(originalEvent) === false) {
            return false;
        }
        var dataTransfer = originalEvent.dataTransfer;
        if (__validValue(dataTransfer) === false) {
            return false;
        }
        var files = dataTransfer.files;
        if (__validValue(files) === false) {
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
        var eventType = 'custom/drag/drop/files';
        if (__containsDirectories(event) === true) {
            var callback = function(files) {
                $element.triggerHandler(eventType, [files, true]);
            }
            __convertDataTransferItemsToFiles(event, callback);
        } else {
            var files = event.originalEvent.dataTransfer.files;
            $element.triggerHandler(eventType, [files]);
        }
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
     * __sortEntriesByName
     * 
     * @see     https://stackoverflow.com/questions/10234515/html5-file-system-how-to-read-directories-using-directory-reader
     * @see     https://stackoverflow.com/questions/2140627/javascript-case-insensitive-string-comparison
     * @access  private
     * @param   Array entries
     * @return  void
     */
    var __sortEntriesByName = function(entries) {
        entries.sort(function(a, b) {
            var first = a.name.toLowerCase(),
                second = b.name.toLowerCase();
            return first < second ? -1 : second < first ? 1 : 0;
        });
    };

    /**
     * __supportsDirectories
     * 
     * @access  private
     * @return  Boolean
     */
    var __supportsDirectories = function() {
        return __allowDirectoryDropping;
    };

    /**
     * __validValue
     * 
     * @access  private
     * @param   mixed value
     * @return  Boolean
     */
    var __validValue = function(value) {
        if (value === undefined) {
            return false;
        }
        if (value === null) {
            return false;
        }
        return true;
    };

    /**
     * __construct
     * 
     * Operates as the constructor by calling the private __setupListeners
     * function, and returning itself to allow for chaining.
     */
    $.fn.listenForFileAndTabDrag = function(options) {
        options = options || [];
        if (options.allowDirectoryDropping !== undefined) {
            __allowDirectoryDropping = options.allowDirectoryDropping;
        }
        __setupListeners(this);
        return this;
    };
})(jQuery);
