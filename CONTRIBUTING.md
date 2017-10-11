# Marbles Contributing
Want to help improve the demo? Awesome. 
You can propose and find things to work on in the [issues](https://github.com/IBM-Blockchain/marbles/issues) section. 

Before writing code, keep these rules in mind:

### Code Guidelines
1. Indent with tabs
1. Use single quotes on strings in JS files
	1. Can use double quotes in html/pug files
1. Variable names should use underscores or camelCase, no dashes.
1. Don't bring in a million npm modules into the project if you can help it
1. [Optional] This project has a [jshint](http://jshint.com/) linter file. If you install a plugin in your IDE it will help enforce other rules. You don't have to pass all the rules, use your own judgement. 

### PR Guidelines
1. Commits should have brief, meaningful messages (1 sentence or so)
1. The PR title and description should not be blank.
	1. If fixing a [Marbles Issue](https://github.com/IBM-Blockchain/marbles/issues), link to it in the description.
1. Keep PRs scoped to one thing at a time. ie don't tackle two issues in one PR.
1. [Optional] Squash commits that fix things like typos, or fixing mistakes you introduced
	- If you don't follow this rule I may squash your PR into 1 commit
