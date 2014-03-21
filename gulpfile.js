var breakpoint;
var breakpoints = {
	xs: 320,
	sm: 480,
	md: 640,
	lg: 1024,
	xl: 1200
};

var dictionary = {
	
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
	
	return glob("html/*.html", {}, function (er, files) {
		
		var modifyHtml = function (rawHtml) {
			var pattern = new RegExp(/class=".{1,}"/g);
			var matches = rawHtml.match(pattern);
			for (i = 0; i < matches.length; i += 1) {
				var pattern2 = new RegExp(/".{1,}"/);
				var match2 = pattern2.exec(matches[i]);
				var replaceUs = match2[0].substring(1, match2[0].length-1);
				var classes = replaceUs.split(" ");
				var modifiedClasses = [];
				for (var ii = 0; ii < classes.length; ii += 1) {
					if (breakpoints[classes[ii]] !== undefined) {
						breakpoint = classes[ii];
					}
					else {
						if (breakpoint) {
							modifiedClasses.push(breakpoint + "-" + classes[ii]);
						} else {
							modifiedClasses.push(classes[ii]);
						}
					}
				}
				var resultClassString = modifiedClasses.join(" ");
				if (resultClassString.length > 0) {
					var regExp3 = new RegExp(replaceUs, "g");
					rawHtml = rawHtml.replace(regExp3, resultClassString);
				}
				
			}
			console.info(rawHtml);
			return rawHtml;
		};
	
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
			
			read(files[i], "utf-8").then(function (rawHtml) {
				saveFile(fileName, modifyHtml(rawHtml));
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
  gulp.watch('gulpfile.js', ['glob']);
});

// Default Task
gulp.task('default', ['clean', 'glob', 'watch']);
