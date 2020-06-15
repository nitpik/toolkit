/**
 * @fileoverview Doubly-linked list representing tokens.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { OrderedSet } from "@humanwhocodes/ordered-set";

//-----------------------------------------------------------------------------
// TypeDefs
//-----------------------------------------------------------------------------

/**
 * @typedef TokenListOptions
 * @property {boolean} collapseWhitespace If true, replaces multiple whitespace
 *      characters with a single space.
 * @property {string} lineEndings The string to use as a line ending.
 *      before lines are deleted from the token list.
 */

//-----------------------------------------------------------------------------
// Private
//-----------------------------------------------------------------------------

const rangeStarts = Symbol("rangeStarts");

const WHITESPACE = /\s/;
export const NEWLINE = /[\r\n]/;

/** @type TokenListOptions */
const DEFAULT_OPTIONS = {
    lineEndings: "\n",
    collapseWhitespace: true,
    newLinePattern: NEWLINE
};

//-----------------------------------------------------------------------------
// Helpers
//-----------------------------------------------------------------------------

/**
 * Determines if the given character is a non-newline whitespace character.
 * @param {string} c The character to check.
 * @returns {boolean} True if the character is a non-newline whitespace
 *      character; false if not. 
 */
function isWhitespace(c, options) {
    return WHITESPACE.test(c) && !options.newLinePattern.test(c);
}

function buildTokenList(list, tokens, text, options) {
    let tokenIndex = 0;
    let index = 0;

    while (index < text.length) {
        let token = tokens[tokenIndex];

        // next part is a token
        if (token && token.range[0] === index) {
            list.add(token);
            index = token.range[1];
            tokenIndex++;
            continue;
        }

        // otherwise it's whitespace, LineBreak, or EOF
        let c = text.charAt(index);
        if (c) {

            if (options.newLinePattern.test(c)) {

                let startIndex = index;

                if (c === "\r") {
                    if (text.charAt(index + 1) === "\n") {
                        index++;
                    }
                }

                list.add({
                    type: "LineBreak",
                    value: options.lineEndings,
                    range: [startIndex, index]
                });

                index++;
                continue;
            }

            if (isWhitespace(c, options)) {
                let startIndex = index;
                do {
                    index++;
                } while (isWhitespace(text.charAt(index), options));

                let value = text.slice(startIndex, index);

                /*
                 * If the previous part is a line break or start of the file
                 * (list is empty), then this is an indent and should not be
                 * changed. Otherwise, collapse the whitespace to a single
                 * space.
                 */
                if (options.collapseWhitespace) {
                    const previous = list.last();
                    if (!list.isLineBreak(previous) && !list.isEmpty()) {
                        value = " ";
                    }
                }

                list.add({
                    type: "Whitespace",
                    value,
                    range: [startIndex, index]
                });

                continue;
            }

        }

    }

}

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * A doubly-linked list representing the parts of source code.
 */
export class AbstractTokenList extends OrderedSet {

    /**
     * Creates a new instance.
     */
    constructor(iterable) {

        super();

        /**
         * Keeps track of where in the source text that each token starts.
         * @property rangeStarts
         * @type Map
         * @private
         */
        this[rangeStarts] = new Map();

        // if an iterable was passed, add the items
        if (iterable && Symbol.iterator in iterable) {
            for (const part of iterable) {
                this.add(part);
            }
        }
    }

    static get [Symbol.species]() {
        return this;
    }

    /**
     * Builds a token list from an array of tokens and the source
     * text of code.
     * @param {Array} tokens The array of tokens to build from. This should
     *      both all tokens, including comments, sorted. 
     * @param {string} text The original text of the source code. 
     * @param {TokenListOptions} options The options to apply to the token list. 
     */
    static from({ tokens, text, options }) {
        const list = new this[Symbol.species]();
        buildTokenList(list, tokens, text, {
            ...DEFAULT_OPTIONS,
            ...options
        });
        return list;
    }

    /**
     * Adds a new token and keeps track of its starting position.
     * @param {Token} part The part to add.
     * @returns {void}
     */
    add(part) {
        super.add(part);
        if (part.range) {
            this[rangeStarts].set(part.range[0], part);
        }
    }

    /**
     * Deletes a new token and its starting position.
     * @param {Token} part The part to delete.
     * @returns {void}
     */
    delete(part) {
        super.delete(part);
        if (part.range) {
            this[rangeStarts].delete(part.range[0]);
        }
    }

    /**
     * Inserts a token after a given token that already exists in the
     * set.
     * @param {*} part The token to insert.
     * @param {*} relatedPart The token after which to insert the new
     *      token.
     * @returns {void}
     * @throws {Error} If `part` is an invalid value for the set.
     * @throws {Error} If `part` already exists in the set.
     * @throws {Error} If `relatedPart` does not exist in the set.
     */
    insertAfter(part, relatedPart) {
        super.insertAfter(part, relatedPart);
        if (part.range) {
            this[rangeStarts].set(part.range[0], part);
        }
    }

    /**
     * Inserts a token before a given token that already exists in the
     * set.
     * @param {*} part The token to insert.
     * @param {*} relatedPart The token before which to insert the new
     *      token.
     * @returns {void}
     * @throws {Error} If `part` is an invalid value for the set.
     * @throws {Error} If `part` already exists in the set.
     * @throws {Error} If `relatedPart` does not exist in the set.
     */
    insertBefore(part, relatedPart) {
        super.insertBefore(part, relatedPart);
        if (part.range) {
            this[rangeStarts].set(part.range[0], part);
        }
    }

    /**
     * Gets the token that begins at the given index in the source text.
     * @param {int} start The range start. 
     * @returns {Token} The token is found or `undefined` if not.
     */
    getByRangeStart(start) {
        return this[rangeStarts].get(start);
    }

    /**
     * Determines if a given token is whitespace.
     * @param {Token} token The token to check.
     * @returns {boolean} True if the token is whitespace, false if not.
     */
    isWhitespace(token) {
        return Boolean(token && token.type === "Whitespace");
    }

    /**
     * Determines if a given token is line break.
     * @param {Token} token The token to check.
     * @returns {boolean} True if the token is a line break, false if not.
     */
    isLineBreak(token) {
        return Boolean(token && token.type === "LineBreak");
    }

    /**
     * Determines if a given token is whitespace or a line break.
     * @param {Token} token The token to check.
     * @returns {boolean} True if the token is whitespace or a line break,
     *      false if not.
     */
    isWhitespaceOrLineBreak(token) {
        return this.isWhitespace(token) || this.isLineBreak(token);
    }

    /**
     * Determines if a given token is a comment.
     * @param {Token} token The token to check.
     * @returns {boolean} True if the token is a comment, false if not.
     */
    isComment(token) {
        return token.type.endsWith("Comment");
    }

    /**
     * Determines if a given token is an indent. Indents are whitespace
     * immediately preceded by a line break or `undefined` if the token
     * is the first whitespace in the file.
     * @param {Token} token The token to check.
     * @returns {boolean} True if the token is an indent, false if not. 
     */
    isIndent(token) {
        const previous = this.previous(token);
        return Boolean(
            this.isWhitespace(token) &&
            (!previous || this.isLineBreak(previous))
        );
    }

    /**
     * Determines if the list is empty.
     * @returns {boolean} True if the list is empty, false if not.
     */
    isEmpty() {
        return !this.first();
    }

    /**
     * Finds the first non-whitespace token on the same line as the
     * given token.
     * @param {Token} token The token whose line should be searched. 
     * @returns {Token} The first non-whitespace token on the line.
     */
    findFirstTokenOrCommentOnLine(token) {
        const lineBreak = this.findPreviousLineBreak(token);
        return lineBreak ? this.nextTokenOrComment(lineBreak) : this.first();
    }

    /**
     * Finds the closest previous token that represents an indent.
     * @param {Token} token The part to start searching from. 
     * @returns {Token} The token if found or `undefined` if not.
     */
    findPreviousIndent(token) {
        let previousToken = this.previous(token);
        while (previousToken && !this.isIndent(previousToken)) {
            
            // if we hit a line break, there was no previous indent
            if (this.isLineBreak(previousToken)) {
                return undefined;
            }
            
            previousToken = this.previous(previousToken);
        }
        return previousToken;
    }

    /**
     * Finds the closest previous token that represents a line break.
     * @param {Token} token The part to start searching from. 
     * @returns {Token} The token if found or `undefined` if not.
     */
    findPreviousLineBreak(token) {
        let previousToken = this.previous(token);
        while (previousToken && !this.isLineBreak(previousToken)) {
            previousToken = this.previous(previousToken);
        }
        return previousToken;
    }

    /**
     * Returns the next non-whitespace, non-comment token after the given part.
     * @param {Token} startToken The part to search after.
     * @returns {Token} The next part or `undefined` if no more parts.
     */
    nextToken(startToken) {
        return this.findNext(token => {
            return !this.isWhitespaceOrLineBreak(token) &&
                !this.isComment(token);
        }, startToken);
    }

    /**
     * Returns the next non-whitespace token after the given token.
     * @param {Token} startToken The token to search after.
     * @returns {Token} The next token or `undefined` if no more tokens.
     */
    nextTokenOrComment(startToken) {
        return this.findNext(token => {
            return !this.isWhitespaceOrLineBreak(token);
        }, startToken);
    }

    /**
     * Returns the previous non-whitespace, non-comment token before the given part.
     * @param {Token} startToken The part to search before.
     * @returns {Token} The previous part or `undefined` if no more tokens.
     */
    previousToken(startToken) {
        return this.findPrevious(token => {
            return !this.isWhitespaceOrLineBreak(token) &&
                !this.isComment(startToken);
        }, startToken);
    }

    /**
     * Returns the previous non-whitespace token after the given token.
     * @param {Token} startToken The token to search after.
     * @returns {Token} The next token or `undefined` if no more tokens.
     */
    previousTokenOrComment(startToken) {
        return this.findPrevious(token => {
            return !this.isWhitespaceOrLineBreak(token)
        }, startToken);
    }

}
