var breakpoint;
var breakpoints = {
	xs: 320,
	sm: 480,
	md: 640,
	lg: 1024,
	xl: 1200
};

var cssString = "";
var addedCssClasses = [];
var escapeRegExp = function(str) {
	return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
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
		for (i = 0; i < matches.length; i += 1) {
			var pattern2 = new RegExp(/"(.{1,})"/);
			var match2 = pattern2.exec(matches[i]);
			if (match2) {
				replaceUs = match2[0].substring(1, match2[0].length - 1);
				allBreakPointClasses = [];
				for (var breakpoint in breakpoints) {
					if (breakpoints.hasOwnProperty(breakpoint)) {
						var breakPointCss = breakPointStyle(breakpoint);
						var regExp = breakpoint + "\\(.{1,}?\\)";
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
									var breakPointClass = breakpoint + "-" + bareStyleClass;
									allBreakPointClasses.push(breakPointClass);
									if (dictionary[bareStyleClass]) {
										if (addedCssClasses.indexOf(breakpoint + "-" + bareStyleClass) === -1) {
											cssString += dictionary[bareStyleClass](breakPointCss, breakpoint, bareStyleClass);
										} else {
											console.log("Already added: " + breakpoint + "-" + bareStyleClass);
										}
									} else {
										console.log("CSS generator for " + breakpoint + "-" + bareStyleClass + " not found!");
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
	return { rawHtml: rawHtml, cssString: cssString };
};

var replaceFullClassName = function (template, fullStyleClass) {
	var template2 = template.replace("fullClassName", fullStyleClass);
	return template2;
};

var dictionary = {
	"bt-no": function (breakPointCss, breakpoint, bareStyleClass) {
		var template = breakPointCss.replace("placeholder", "border-top: none;");
		var template2 = template.replace("bareStyleClass", bareStyleClass);
		var template3 = replaceFullClassName(template2, breakpoint + "-" + bareStyleClass);
		addedCssClasses.push(breakpoint + "-bt-no");
		return template3;
	},
	left: function (breakPointCss, breakpoint, bareStyleClass) {
		var template = breakPointCss.replace("placeholder", "float: left;");
		var template2 = template.replace("bareStyleClass", bareStyleClass);
		var template3 = replaceFullClassName(template2, breakpoint + "-" + bareStyleClass);
		addedCssClasses.push(breakpoint + "-left");		
		return template3;
	},
	right: function (breakPointCss, breakpoint, bareStyleClass) {
		var template = breakPointCss.replace("placeholder", "float: right;");
		var template2 = template.replace("bareStyleClass", bareStyleClass);
		var template3 = replaceFullClassName(template2, breakpoint + "-" + bareStyleClass);
		addedCssClasses.push(breakpoint + "-right");
		return template3;
	}
};

var breakPointStyle = function (breakPoint) {
	var template = "@media screen and (min-width: " + breakpoints[breakPoint] + "px) {\n/*" + breakPoint + "-bareStyleClass*/\n\t.fullClassName {\n\t\tplaceholder\n\t}\n}\n\n";
	return template;
};

// Include gulp
var gulp = require('gulp');

// Include plugins
var clean = require('gulp-clean');
var jshint = require('gulp-jshint');
var glob = require("glob");
var fs = require('fs'); // File system
var Promise = require('promise');

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
	
	return glob("public/templates/*.html", {}, function (er, files) {
		
		var saveFile = function (fileName, data) {
			fs.writeFile(fileName, data, "utf-8", function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("The file was saved!");
				}
			});
		};
		
		var handleFile = function (fileName) {

			var read = Promise.denodeify(fs.readFile);
			
			read(fileName, "utf-8").then(function (rawHtml) {
				var result = new Template(fileName, rawHtml).compile();
				//console.info("public/views/" + fileName.substring(fileName.lastIndexOf("/") + 1));
				saveFile("public/views/" + fileName.substring(fileName.lastIndexOf("/") + 1), result.rawHtml);
				saveFile("public/css/once.css", result.cssString);
			});
		};
		
		for (var i = 0; i < files.length; i += 1) {
			handleFile(files[i]);
		}
	});
});

// Watch Files For Changes
gulp.task('watch', function() {
  gulp.watch('gulpfile.js', ['jslint']);
  gulp.watch('public/templates/*.html', ['glob']);
});

// Default Task
gulp.task('default', ['clean', 'glob', 'watch']);

