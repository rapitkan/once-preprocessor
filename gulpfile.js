"use strict";

// Include gulp
var gulp = require('gulp');

// Include plugins
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var glob = require("glob");
var fs = require('fs'); // File system
var Promise = require('promise');

var breakPoints = {
	xs: "320px",
	sm: "480px",
	md: "640px",
	lg: "1024px",
	xl: "1200px"
};

var dictionary = {
	left: {
		css: "float: left;"
	},
	right: {
		css: "float: right;"
	},
    inline: {
        css: "display: inline;"
    },
    'p-eta': {
    	css: "padding: 1em;"
    }
};

var breakPointStyle = function (breakPoint) {
    var cssMarkUpByBreakPoint = "";
    for (var key in cssStructure[breakPoint]) {
        cssMarkUpByBreakPoint += cssStructure[breakPoint][key];
    }
    return "\n@media screen and (min-width: " + breakPoints[breakPoint] + ") {\n" + cssMarkUpByBreakPoint + "\n}";
};

var addStyleClass = function (fullStyleClass, bareStyleClass) {
	return "\t/*" + fullStyleClass + "*/\n\t." + fullStyleClass + " {\n\t\t" + dictionary[bareStyleClass || fullStyleClass].css + "\n\t}\n";
};
var cssString = "";
var cssStructure = {};

var escapeRegExp = function(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};




var FileHandler = function () {
	this.fileList = [];
};

FileHandler.prototype.listFile = function (fileName) {
	this.fileList[fileName] = new File(fileName);
	return this.fileList[fileName];
};

var File = function (name, content) {
	this.name = name;
	this.content = content;
};

File.prototype.read = function (callback) {
    var self = this,
    	read = Promise.denodeify(fs.readFile);
    read(this.name, "utf-8").then(function (content) {
    	self.content = content;
    	return callback(self);
    });
};

File.prototype.save = function (content) {
	var self = this;
	this.content = content;

	var write = Promise.denodeify(fs.writeFile);

    return write(this.name, this.content, "utf-8").then(function (err) {
        if (err) {
            console.log(err);
        } else {
            console.log("The file " + self.name + " was saved!");
        }
    });
};

File.prototype.compile = function () {
	var rawHtml = rawHtml ? rawHtml : this.content;
	var pattern = new RegExp(/class=".{1,}"/g);
	var matches = rawHtml.match(pattern);
	var classes = "";
	var allBreakPointClasses = [];
	var compiledClasses;
	var customClasses;
	var missingClasses;
	var matchNotFound;
	if (matches) {
		for (var i = 0; i < matches.length; i += 1) {
			compiledClasses = [];
			missingClasses = [];
			customClasses = [];
			classes = matches[i].substring(7, matches[i].length - 1).split(" ");
			console.info("classes: ", classes);
			for (var ii = 0; ii < classes.length; ii += 1) {
				if (dictionary[classes[ii]]) {
					cssStructure[classes[ii]] = addStyleClass(classes[ii]);
					compiledClasses.push(classes[ii]);
				} else {
					console.info("Handling class: ", classes[ii]);
					matchNotFound = true;
					for (var breakPoint in breakPoints) {
						if (breakPoints.hasOwnProperty(breakPoint)) {
							var regExp = breakPoint + "\\(.{1,}?\\)";
							var pattern3 = new RegExp(regExp);
							var match3 = classes[ii].match(pattern3);
							if (match3) {
								matchNotFound = false;
								var pattern4 = new RegExp(/\(.{1,}\)/);
								var match4 = match3[0].match(pattern4);
								if (match4) {
									var connectUs = match4[0].substring(1, match4[0].length - 1);
									var tmpArr = connectUs.split(",");
									for (var iii = 0; iii < tmpArr.length; iii += 1) {
										var bareStyleClass = tmpArr[iii].replace(":", "-");
										var breakPointClass = breakPoint + "-" + bareStyleClass;
										if (dictionary[bareStyleClass]) {
		                                    if (!cssStructure[breakPoint]) {
		                                        cssStructure[breakPoint] = {};
		                                    }
		                                    cssStructure[breakPoint][bareStyleClass] = addStyleClass(breakPointClass, bareStyleClass);
		                                    compiledClasses.push(breakPointClass);
										} else {
											missingClasses.push(breakPointClass);
											console.log("CSS generator for " + breakPoint + "-" + bareStyleClass + " not found!");
										}
									}
								}
							}
						}
					}
					if (matchNotFound) {
						customClasses.push(classes[ii]);
						console.info("Class '" + classes[ii] + "' is a custom class.");
					}
				}
			}
			console.info("Compiled classes for ", classes, " are: ", compiledClasses);
			if (missingClasses.length) {
				console.info("Missing from the dictionary: ", missingClasses);				
			}
			var regExp3 = new RegExp(escapeRegExp(classes.join(" ")), "g");
			rawHtml = rawHtml.replace(regExp3, [customClasses.join(" "), compiledClasses.join(" "), missingClasses.join(" ")].join(" "));
		}
	}
	return rawHtml;
};

var onceStyleSheetPath = "exampleProject/public/css/once.css";
var onceStyleSheet = new FileHandler().listFile(onceStyleSheetPath);

// Clean
gulp.task('clean', function () {
  gulp.src('build', {read: false})
    .pipe(clean());
});

// Lint Task
gulp.task('jslint', function() {
  return gulp.src('gulpfile.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});

gulp.task('glob', function() {

	return new Promise(function (resolve, reject) {
        glob("exampleProject/public/templates/*.html", {}, function (er, files) {

        	var templateFile, viewFile;
        	var fileHandler = new FileHandler();

            var filesLeft = files.length;

            while (files.length) {
                templateFile = fileHandler.listFile(files.shift());
            	templateFile.read(function (file) {
            		viewFile = fileHandler.listFile("exampleProject/public/views/" + file.name.substring(file.name.lastIndexOf("/") + 1));
            		console.info(viewFile);
            		viewFile.save(file.compile()).then(function () {
            			filesLeft -= 1;
	            		if (!filesLeft) {
	            			console.info("Saving the Once style sheet...");
	            			resolve();
	            		}            			
            		});
            	});
            }
        });
    });
});

gulp.task('updateCSS', ['glob'], function () {
    var styles = "";
    console.info(cssStructure);
    for (var key in cssStructure) {
    	if (breakPoints[key]) {
        	styles += breakPointStyle(key);
    	} else  {
    		styles += cssStructure[key];
    	}
    }
    onceStyleSheet.save(styles);
});    		

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('gulpfile.js', ['jslint']);
  gulp.watch('exampleProject/public/templates/*.html', ['glob']);
});

// Default Task
gulp.task('default', ['clean', 'glob', 'updateCSS', 'watch']);

