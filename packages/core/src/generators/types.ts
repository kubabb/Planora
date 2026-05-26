// Base generator interface

export interface Generator<TInput = Record<string, string>, TOutput = string> {
  generate(input: TInput): TOutput;
}
