/**
 * This module contains constants common to both reading and writing schemas in
 * the JSON format internal to salve.
 *
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */
import { AnyName, Attribute, BasePattern, Choice, Data, Define, Element, Empty,
         EName, Grammar, Group, Interleave, List, Name, NameChoice, NotAllowed,
         NsName, OneOrMore, Param, Ref, Text, Value } from "../patterns";

export type NamePattern = Name | NameChoice | NsName | AnyName;

export type PatternCtor = { new (...args: any[]): (BasePattern | NamePattern) };
export type ENameCtor = { new (...args: any[]): EName };

export type Ctors = PatternCtor | ENameCtor | typeof Array;

//
// MODIFICATIONS TO THIS TABLE MUST BE REFLECTED IN ALL OTHER TABLES IN THIS
// MODULE.
//
export const codeToConstructor: Ctors[] = [
  Array,
  Empty,
  Data,
  List,
  Param,
  Value,
  NotAllowed,
  Text,
  Ref,
  OneOrMore,
  Choice,
  Group,
  Attribute,
  Element,
  Define,
  Grammar,
  EName,
  Interleave,
  Name,
  NameChoice,
  NsName,
  AnyName,
];

//
// MODIFICATIONS TO THIS MAP MUST BE REFLECTED IN ALL OTHER TABLES IN THIS
// MODULE.
//
export const nameToCode: Record<string, number> = Object.create(null);
nameToCode.Array = 0;
nameToCode.Empty = 1;
nameToCode.Data = 2;
nameToCode.List = 3;
nameToCode.Param = 4;
nameToCode.Value = 5;
nameToCode.NotAllowed = 6;
nameToCode.Text = 7;
nameToCode.Ref = 8;
nameToCode.OneOrMore = 9;
nameToCode.Choice = 10;
nameToCode.Group = 11;
nameToCode.Attribute = 12;
nameToCode.Element = 13;
nameToCode.Define = 14;
nameToCode.Grammar = 15;
nameToCode.EName = 16;
nameToCode.Interleave = 17;
nameToCode.Name = 18;
nameToCode.NameChoice = 19;
nameToCode.NsName = 20;
nameToCode.AnyName = 21;

// This is a bit field
export const OPTION_NO_PATHS = 1;
// var OPTION_WHATEVER = 2;
// var OPTION_WHATEVER_PLUS_1 = 4;
// etc...
