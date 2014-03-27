"use strict";

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
	return "\t/*" + fullStyleClass + "*/\n\t." + fullStyleClass + "{\n\t\t" + dictionary[bareStyleClass].css + "\n\t}\n";
};
var cssString = "";
var cssStructure = {};

var escapeRegExp = function(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};

var saveFile = function (fileName, data) {

    var write = Promise.denodeify(fs.writeFile);

    write(fileName, data, "utf-8").then(function () {
        if (err) {
            console.log(err);
        } else {
            console.log("The file " + fileName + " was saved!");
        }
    });
};

function Template(fileName, content) {
	this.fileName = fileName;
	this.content = content;
}

Template.prototype.compile = function () {
	var rawHtml = rawHtml ? rawHtml : this.content;
	var pattern = new RegExp(/class=".{1,}"/g);
	var matches = rawHtml.match(pattern);
	var replaceUs = "";
	var allBreakPointClasses = [];
	if (matches) {
		for (var i = 0; i < matches.length; i += 1) {
			var pattern2 = new RegExp(/"(.{1,})"/);
			var match2 = pattern2.exec(matches[i]);
			if (match2) {
				replaceUs = match2[0].substring(1, match2[0].length - 1);
				allBreakPointClasses = [];
				for (var breakPoint in breakPoints) {
					if (breakPoints.hasOwnProperty(breakPoint)) {
						var regExp = breakPoint + "\\(.{1,}?\\)";
						var pattern3 = new RegExp(regExp);
						var match3 = replaceUs.match(pattern3);
						if (match3) {
							var pattern4 = new RegExp(/\(.{1,}\)/);
							var match4 = match3[0].match(pattern4);
							if (match4) {
								var connectUs = match4[0].substring(1, match4[0].length-1);
								var tmpArr = connectUs.split(",");
								var breakPointClasses = [];
								for (var ii = 0; ii < tmpArr.length; ii += 1) {
									var bareStyleClass = tmpArr[ii].replace(":", "-");
									var breakPointClass = breakPoint + "-" + bareStyleClass;
									allBreakPointClasses.push(breakPointClass);
									if (dictionary[bareStyleClass]) {
                                        if (!cssStructure[breakPoint]) {
                                            cssStructure[breakPoint] = {};
                                        }
                                        cssStructure[breakPoint][bareStyleClass] = addStyleClass(breakPointClass, bareStyleClass);
									} else {
										console.log("CSS generator for " + breakPoint + "-" + bareStyleClass + " not found!");
									}
								}
							}
						}
					}
				}
			}
            var resultClassString = allBreakPointClasses.join(" ");
			if (resultClassString.length > 0) {
				var regExp3 = new RegExp(escapeRegExp(replaceUs), "g");
				rawHtml = rawHtml.replace(regExp3, resultClassString);
			}
		}
	}
	return rawHtml;
};

// Include gulp
var gulp = require('gulp');

// Include plugins
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var glob = require("glob");
var fs = require('fs'); // File system
var Promise = require('promise');
var promisify = require('deferred').promisify;

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
        glob("public/templates/*.html", {}, function (er, files) {

            var filesLeft = files.length;

            var handleFile = function (fileName) {
                console.info("handling " + fileName);
                var read = Promise.denodeify(fs.readFile);
                
                read(fileName, "utf-8").then(function (rawHtml) {
                    var result = new Template(fileName, rawHtml).compile();
                    saveFile("public/views/" + fileName.substring(fileName.lastIndexOf("/") + 1), result);
                    filesLeft -= 1;
                    if (filesLeft < 1) {
                        console.info("Files read!");
                        resolve();                            
                    }
                });
            };

            while (files.length) {
                handleFile(files.shift());
            }
        });
    });
});

gulp.task('updateCSS', ['glob'], function () {
    var styles = "";
    console.info("Updating once.css");
    for (var breakPoint in cssStructure) {
        styles += breakPointStyle(breakPoint);
    }
    saveFile("public/css/once.css", styles);
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('gulpfile.js', ['jslint']);
  gulp.watch('public/templates/*.html', ['glob']);
});

// Default Task
gulp.task('default', ['clean', 'glob', 'updateCSS', 'watch']);

