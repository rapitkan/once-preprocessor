Once Preprocessor
=================

HTML preprocessor for Once CSS framework

Once Preprocessor is an HTML preprocessor that generates atomic CSS styles for you. Idea is to use atomic class markup in HTML templates and preprocessor compiles the templates in background.

Example: 

We have the following breakpoints: xs: 320px and sm: 480px.
```html
In this use case <div class="xs(right)sm(left)">This div is created for example.</div>
will be compiled to <div class="xs-right sm-left">This div is created for example.</div>
and the specific css markup would be:

@media screen and (min-width: 320px) {
	/*xs-right*/
	.xs-right{
		float: right;
	}
}
@media screen and (min-width: 480px) {
	/*sm-left*/
	.sm-left{
		float: left;
	}
}
```
## Development environment setup

1. Clone Once Preprocessor to your desired location:
	
	git clone https://github.com/rapitkan/once-preprocessor.git destination/

2. Download & install Node.js
3. Move to the project folder
4. Run: npm install (use sudo if you get errors without it)
5. Type: npm start
6. Open project with your favourite editor
7. Start coding