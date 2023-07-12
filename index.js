/**
 * @module wordwrapjs
 */

/**
 * Wordwrap options.
 * @typedef {Object} WordwrapOptions
 * @property {number} [width=30] - The max column width in characters.
 * @property {boolean} [break=false] - If true, words exceeding the specified `width` will be forcefully broken
 * @property {boolean} [noTrim=false] - By default, each line output is trimmed. If `noTrim` is set, no line-trimming occurs - all whitespace from the input text is left in.
 * @property {string} [eol='\n'] - The end of line character to use. Defaults to `\n`.
 */

const re = {
  chunk: /[^\s-]+?-\b|\S+|\s+|\r\n?|\n/g,
  ansiEscapeSequence: /\u001b.*?m/g
}

/**
 * @alias module:wordwrapjs
 * @typicalname wordwrap
 */
class Wordwrap {
  /**
   * @param {string} text - The input text to wrap.
   * @param {module:wordwrapjs~WordwrapOptions} [options]
   */
  constructor (text = '', options = {}) {
    this._lines = String(text).split(/\r\n|\n/g)
    this.options = {
      eol: '\n',
      width: 30,
      ...options
    }
  }

  lines () {
    /* trim each line of the supplied text */
    return this._lines.map(trimLine, this)

      /* split each line into an array of chunks, else mark it empty */
      .map(line => line.match(re.chunk) || ['~~empty~~'])

      /* optionally, break each word on the line into pieces.  Accepts 'break' or 'cut' */
      .map(lineWords => (this.options.break || this.options.cut)
        ? lineWords.map(breakWord, this)
        : lineWords
      )

      .map(lineWords => lineWords.flat())

      /* transforming the line of words to one or more new lines wrapped to size */
      .map(lineWords => {
        return lineWords
          .reduce((lines, word) => {
            const currentLine = lines[lines.length - 1]
            if (replaceAnsi(word).length + replaceAnsi(currentLine).length > this.options.width) {
              lines.push(word)
            } else {
              lines[lines.length - 1] += word
            }
            return lines
          }, [''])
      })
      .flat()

      /* Adding a simple option to add an indentation of user's choice, specified by indent: 'string' */
      .map(line => this.options.indent
        ? this.options.indent + line
        : line
      )

      /* Adding an escape function to be run at the end of each line, e.g. escape: function(string){ return string + ''; } */
      .map(line => this.options.escape
        ? this.options.escape(line)
        : line
      )

      /* trim the wrapped lines */
      .map(trimLine, this)

      /* filter out empty lines */
      .filter(line => line.trim())

      /* restore the user's original empty lines */
      .map(line => line.replace('~~empty~~', ''))
  }

  /* Attaches a string to the end of each line, specified by options.newline or options.eol */
  wrap () {
    return this.lines().join(this.options.newline
      ? this.options.newline
      : this.options.eol
    )
  }

  toString () {
    return this.wrap()
  }

  /**
   * @param {string} text - the input text to wrap
   * @param {module:wordwrapjs~WordwrapOptions} [options]
   */
  static wrap (text, options) {
    const block = new this(text, options)
    return block.wrap()
  }

  /**
   * Wraps the input text, returning an array of strings (lines).
   * @param {string} text - input text
   * @param {module:wordwrapjs~WordwrapOptions} [options]
   */
  static lines (text, options) {
    const block = new this(text, options)
    return block.lines()
  }

  /**
   * Returns true if the input text would be wrapped if passed into `.wrap()`.
   * @param {string} text - input text
   * @return {boolean}
   */
  static isWrappable (text = '') {
    const matches = String(text).match(re.chunk)
    return matches ? matches.length > 1 : false
  }

  /**
   * Splits the input text into an array of words and whitespace.
   * @param {string} text - input text
   * @returns {string[]}
   */
  static getChunks (text) {
    return text.match(re.chunk) || []
  }
}

/**
 * Trims the line of whitespace if options.noTrim is true or options.trim is false.
 * @param {string} line - split part of input text
 * @returns {string[]}
*/
function trimLine (line) {
  return (this.options.noTrim || (this.options.trim === false)) ? line : line.trim()
}

function replaceAnsi (string) {
  return string.replace(re.ansiEscapeSequence, '')
}

/**
 * break a word into several pieces
 * @param {string} word
 * @private
 */
function breakWord (word) {
  if (replaceAnsi(word).length > this.options.width) {
    const letters = word.split('')
    let piece
    const pieces = []
    while ((piece = letters.splice(0, this.options.width)).length) {
      pieces.push(piece.join(''))
    }
    return pieces
  } else {
    return word
  }
}

export default Wordwrap