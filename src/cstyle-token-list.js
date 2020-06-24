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

const originalIndents = Symbol("originalIndents");

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
         * Keeps track of the original indents for some tokens.
         * @property originalIndents
         * @type Map
         * @private
         */
        this[originalIndents] = new Map();
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
                    list[originalIndents].set(token, previousToken.value);
                }
            }
        }

        return list;
    }

    /**
     * Returns the original indent string for a given token.
     * @param {Token} token The token to look up the original indent for. 
     * @returns {string} The indent before the token in the original string or
     *      an empty string if not found.
     */
    getOriginalCommentIndent(token) {
        return this[originalIndents].get(token) || "";
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
