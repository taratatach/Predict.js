Predict.js
==========

An implementation of spell checking, word completion and word prediction for Firefox OS as my graduation project<br/> 
at Polytech'Nice Sophia.

Norvig.js
=========

An implementation in javascript of [Peter Norvig's spell checker](http://norvig.com/ngrams/ch14.pdf) in Python.
For now, I don't use the context (i.e the preceding word) to correct a word so you don't need to load the bigrams.

To use the spell checker :
* load the unigrams from count_1w.txt
* load the edits from count_1edit.txt
* type your word and click _correct_

I'm working on using a ternary DAG to represent the dictionary.