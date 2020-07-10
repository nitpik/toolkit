/**
 * @fileoverview Doubly-linked list representing tokens in a C-style language.
 * @author Nicholas C. Zakas
 */

//-----------------------------------------------------------------------------
// Imports
//-----------------------------------------------------------------------------

import { TokenList } from "./token-list.js";

//-----------------------------------------------------------------------------
// Private
//-----------------------------------------------------------------------------

const originalComments = Symbol("originalComments");

const INDENT_INCREASE_CHARS = new Set(["{", "[", "("]);
const INDENT_DECREASE_CHARS = new Set(["}", "]", ")"]);

//-----------------------------------------------------------------------------
// Exports
//-----------------------------------------------------------------------------

/**
 * A doubly-linked list representing the parts of C-style source code. A
 * language is considered C-style if it is generally grouped by curly
 * braces and has support for C-style line or block comments.
 */
export class CStyleTokenList extends TokenList {

    /**
     * Creates a new instance.
     */
    constructor(iterable = []) {

        super(iterable);

        /**
         * Keeps track of the original comment forms.
         * @property originalComments
         * @type Map
         * @private
         */
        this[originalComments] = new Map();
    }

    static from({ tokens, text, options }) {

        const list = super.from({ tokens, text, options });

        /*
         * In order to properly indent comments later on, we need to keep
         * track of their original indents before changes are made.
         */
        for (const token of list) {
            if (list.isComment(token)) {
                const previousToken = list.previous(token);
                if (list.isIndent(previousToken)) {
                    list[originalComments].set(token, {
                        value: token.value,
                        indent: previousToken.value
                    });
                }
            }
        }

        return list;
    }

    /**
     * Returns the original comment value and indent string for a given token.
     * @param {Token} token The token to look up the original indent for. 
     * @returns {string} The indent before the token in the original string or
     *      an empty string if not found.
     */
    getOriginalComment(token) {
        return this[originalComments].get(token) || "";
    }

    /**
     * Determines if a given token is a line comment.
     * @param {Token} part The token to check.
     * @returns {boolean} True if the token is a line comment, false if not.
     */
    isLineComment(part) {
        return part.type === "LineComment";
    }

    /**
     * Determines if a given token is a block comment.
     * @param {Token} part The token to check.
     * @returns {boolean} True if the token is a block comment, false if not.
     */
    isBlockComment(part) {
        return part.type === "BlockComment";
    }

    /**
     * Determines if the indent should increase after this token.
     * @param {Token} token The token to check. 
     * @returns {boolean} True if the indent should be increased, false if not.
     */
    isIndentIncreaser(token) {
        return (INDENT_INCREASE_CHARS.has(token.value)) &&
            this.isLineBreak(this.next(token));
    }

    /**
     * Determines if the indent should decrease after this token.
     * @param {Token} token The token to check.
     * @returns {boolean} True if the indent should be decreased, false if not.
     */
    isIndentDecreaser(token) {
        if (INDENT_DECREASE_CHARS.has(token.value)) {
            let lineBreak = this.findPreviousLineBreak(token);
            return !lineBreak || (this.nextToken(lineBreak) === token);
        }

        return false;
    }

}
