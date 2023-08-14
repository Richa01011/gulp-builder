import browserSync from "browser-sync";
import { deleteAsync } from "del";
import gulp from "gulp";
import autoprefixer from "gulp-autoprefixer";
import gulpPug from "gulp-pug";
import gulpSass from "gulp-sass";
import postcss from "gulp-postcss";
import tailwind from "tailwindcss";
import * as dartSass from "sass";
import webpackStream from "webpack-stream";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

const sass = gulpSass(dartSass);
const src = gulp.src;
const dest = gulp.dest;
const watch = gulp.watch;
const series = gulp.series;
const task = gulp.task;

function server() {
	browserSync.init({
		server: {
			baseDir: "./public",
		},
		open: false,
		notify: false,
	});

	watch("./source/pug/**/*.pug", pug).on("all", browserSync.reload);
	watch("./source/scss/**/*.scss", stylesDev);
	watch("./source/js/libs.js", jsLibs);
	watch("./source/js/**/*[.js, .json]", javascript).on("all", browserSync.reload);
	watch("./source/assets/**/*.**", assets).on("all", browserSync.reload);
}

function clear() {
	return deleteAsync("./public");
}

function pug() {
	return src("./source/pug/*.pug").pipe(gulpPug({})).pipe(dest("./public")).pipe(stylesDev());
}
function stylesDev() {
	return src("./source/scss/index.scss")
		.pipe(sass())
		.pipe(postcss([tailwind("./tailwind.config.js")]))
		.pipe(autoprefixer())
		.pipe(dest("./public"))
		.pipe(browserSync.stream());
}
function stylesBuild() {
	return src("./source/scss/index.scss")
		.pipe(
			sass({
				outputStyle: "compressed",
			})
		)
		.pipe(postcss([tailwind("./tailwind.config.js")]))
		.pipe(autoprefixer())
		.pipe(dest("./public"));
}

function assets() {
	return src("./source/assets/**/*.**").pipe(dest("./public/assets"));
}

function jsLibs() {
	return src("./source/js/libs.js")
		.pipe(
			webpackStream({
				mode: "production",
				output: {
					filename: "libs.js",
				},
				module: {
					rules: [
						{
							test: /\.(s*)css$/,
							use: [
								MiniCssExtractPlugin.loader,
								"css-loader",
								{
									loader: "postcss-loader",
									options: {
										postcssOptions: {
											plugins: ["postcss-preset-env"],
										},
									},
								},
								"sass-loader",
							],
						},
					],
				},
				plugins: [
					new MiniCssExtractPlugin({
						filename: "libs.css",
					}),
				],
			})
		)
		.pipe(dest("./public/js"))
		.pipe(browserSync.stream());
}
function javascript() {
	return src(["./source/js/*[.js, .json]", "!./source/js/libs.js"]).pipe(dest("./public/js"));
}

const dev = series(clear, pug, stylesDev, jsLibs, javascript, assets, server);
const build = series(clear, pug, stylesBuild, jsLibs, javascript, assets);

task("dev", dev);
task("build", build);
