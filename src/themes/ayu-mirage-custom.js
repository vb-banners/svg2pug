// Ayu Mirage Bordered Theme for ACE Editor
// Based on the Ayu Mirage color scheme with bordered editor style

import ace from 'brace';

/* eslint-disable no-multi-str */
ace.define("ace/theme/ayu-mirage-custom",["require","exports","module","ace/lib/dom"], function(acequire, exports, module) {

exports.isDark = true;
exports.cssClass = "ace-ayu-mirage-custom";
// Inline CSS mirrors VS Code's Ayu Mirage palette so the Ace HTML/Pug panes match the screenshots.
// Color legend: #FFD173 keywords/classes, #bae67e numbers, #73D0FF constants, #5ccfe6 tags & embedded, #c2d94c strings, #f28779 regex, #FFD173 attributes.
exports.cssText = ".ace-ayu-mirage-custom .ace_gutter {\
background: #1d2330;\
color: #8f9bb8;\
border-right: 1px solid #2c3750\
}\
.ace-ayu-mirage-custom .ace_print-margin {\
width: 1px;\
background: #33415e\
}\
.ace-ayu-mirage-custom {\
background-color: #1f2430;\
color: #d9d7ce;\
border: 1px solid #2c3750;\
border-radius: 4px\
}\
.ace-ayu-mirage-custom .ace_cursor {\
color: #FFD173\
}\
.ace-ayu-mirage-custom .ace_marker-layer .ace_selection {\
background: #33415e\
}\
.ace-ayu-mirage-custom.ace_multiselect .ace_selection.ace_start {\
box-shadow: 0 0 3px 0px #1f2430\
}\
.ace-ayu-mirage-custom .ace_marker-layer .ace_step {\
background: rgb(102, 82, 0)\
}\
.ace-ayu-mirage-custom .ace_marker-layer .ace_bracket {\
margin: -1px 0 0 -1px;\
border: 1px solid #73D0FF\
}\
.ace-ayu-mirage-custom .ace_marker-layer .ace_active-line {\
background: #232834\
}\
.ace-ayu-mirage-custom .ace_gutter-active-line {\
background-color: #232834\
}\
.ace-ayu-mirage-custom .ace_marker-layer .ace_selected-word {\
border: 1px solid #33415e\
}\
.ace-ayu-mirage-custom .ace_invisible {\
color: #33415e\
}\
.ace-ayu-mirage-custom .ace_keyword,\
.ace-ayu-mirage-custom .ace_storage {\
color: #FFD173\
}\
.ace-ayu-mirage-custom .ace_keyword.ace_other.ace_doctype.ace_jade {\
color: #5ccfe6\
}\
.ace-ayu-mirage-custom .ace_keyword.ace_operator {\
color: #d9d7ce\
}\
.ace-ayu-mirage-custom .ace_punctuation,\
.ace-ayu-mirage-custom .ace_punctuation.ace_tag {\
color: #d9d7ce\
}\
.ace-ayu-mirage-custom .ace_constant.ace_character,\
.ace-ayu-mirage-custom .ace_constant.ace_numeric,\
.ace-ayu-mirage-custom .ace_constant.ace_other,\
.ace-ayu-mirage-custom .ace_keyword.ace_other.ace_unit {\
color: #bae67e\
}\
.ace-ayu-mirage-custom .ace_constant.ace_language,\
.ace-ayu-mirage-custom .ace_support.ace_constant {\
color: #73d0ff\
}\
.ace-ayu-mirage-custom .ace_entity.ace_name.ace_tag,\
.ace-ayu-mirage-custom .ace_meta.ace_tag {\
color: #5ccfe6\
}\
.ace-ayu-mirage-custom .ace_support.ace_function {\
color: #5ccfe6\
}\
.ace-ayu-mirage-custom .ace_entity.ace_name.ace_function {\
color: #d9d7ce\
}\
.ace-ayu-mirage-custom .ace_invalid {\
color: #ff3333;\
background-color: #f51818\
}\
.ace-ayu-mirage-custom .ace_invalid.ace_deprecated {\
color: #ff3333;\
background-color: #FFD173\
}\
.ace-ayu-mirage-custom .ace_fold {\
background-color: #73d0ff;\
border-color: #d9d7ce\
}\
.ace-ayu-mirage-custom .ace_entity.ace_name.ace_function,\
.ace-ayu-mirage-custom .ace_variable {\
color: #d9d7ce\
}\
.ace-ayu-mirage-custom .ace_support.ace_class,\
.ace-ayu-mirage-custom .ace_support.ace_type {\
color: #FFD173\
}\
.ace-ayu-mirage-custom .ace_heading,\
.ace-ayu-mirage-custom .ace_markup.ace_heading,\
.ace-ayu-mirage-custom .ace_string {\
color: #D5FF80\
}\
.ace-ayu-mirage-custom .ace_string.ace_regexp {\
color: #f28779\
}\
.ace-ayu-mirage-custom .ace_entity.ace_other.ace_attribute-name,\
.ace-ayu-mirage-custom .ace_support.ace_type.ace_attribute,\
.ace-ayu-mirage-custom .ace_suport.ace_type.ace_attribute,\
.ace-ayu-mirage-custom .ace_support.ace_other.ace_attribute {\
color: #FFD173\
}\
.ace-ayu-mirage-custom .ace_support.ace_constant.embed,\
.ace-ayu-mirage-custom .ace_constant.ace_other.ace_attribute {\
color: #5ccfe6\
}\
.ace-ayu-mirage-custom .ace_entity.ace_other.ace_attribute-name.ace_class,\
.ace-ayu-mirage-custom .ace_entity.ace_other.ace_attribute-name.ace_id,\
.ace-ayu-mirage-custom .ace_suport.ace_type.ace_attribute.ace_class,\
.ace-ayu-mirage-custom .ace_suport.ace_type.ace_attribute.ace_id {\
color: #FFD173\
}\
.ace-ayu-mirage-custom .ace_variable.ace_parameter {\
color: #d9d7ce\
}\
.ace-ayu-mirage-custom .ace_comment {\
color: #5c6773;\
font-style: italic\
}\
.ace-ayu-mirage-custom .ace_indent-guide {\
background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAACCAYAAACZgbYnAAAAEklEQVQImWNgYGBgYHB3d/8PAAOIAdULw8qMAAAAAElFTkSuQmCC) right repeat-y\
}\
.ace-ayu-mirage-custom .ace_content {\
padding: 0 !important;\
}";

var dom = acequire("../lib/dom");
// Inject the theme rules directly into Ace so no external stylesheet is required.
dom.importCssString(exports.cssText, exports.cssClass);
});
