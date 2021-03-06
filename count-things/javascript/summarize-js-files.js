import { extname } from 'path';

import { stats } from './stats.js';

import log from '../../lib/inline-log.js';

// ===== main export =====
export const summarizeJsFiles = (report = {}) => {
  // filter out immediate .js child files
  const jsFiles = report?.files?.filter((file) => extname(file.name) === '.js');
  if (!jsFiles || jsFiles.length === 0) {
    return null;
  }

  const summary = {
    files: {},
    lines: {},
  };

  // --- summarize file lengths ---
  const fileLengths = jsFiles
    .map((file) => file.lines.total)
    .sort((a, b) => b - a);
  summary.files.total = fileLengths.length;
  summary.files.shortest = fileLengths[fileLengths.length - 1];
  summary.files.longest = fileLengths[0];
  Object.assign(summary.files, stats(fileLengths));

  // --- summarize line lengths ---
  const lineLengths = jsFiles
    .flatMap((file) =>
      Object.entries(file.lines.lengths).reduce(
        (all, next) =>
          all.concat(Array(next[1]).fill(Number(next[0]), 0, next[1])),
        [],
      ),
    )
    .sort((a, b) => b - a);
  summary.lines.total = lineLengths.length;
  summary.lines.shortest = lineLengths[lineLengths.length - 1];
  summary.lines.longest = lineLengths[0];
  Object.assign(summary.lines, stats(lineLengths));

  // --- summarize source types ---
  const typesSummary = jsFiles
    .filter((file) => file.type && Object.keys(file.type).length > 0)
    .map((file) => file.type)
    .reduce((all, next) => {
      all[next] = all[next] ? all[next] + 1 : 1;
      return all;
    }, {});
  if (Object.keys(typesSummary).length > 0) {
    summary.types = typesSummary;
  }

  // --- summarize directives ---
  const directivesSummary = jsFiles
    .map((file) => file.directives)
    .filter((directives) => directives)
    .reduce((all, next) => {
      for (const key in next) {
        all[key] = all[key] ? all[key] + next[key] : next[key];
      }
      return all;
    }, {});
  if (Object.keys(directivesSummary).length > 0) {
    summary.directives = directivesSummary;
  }

  // --- summarize parsing errors ---
  // could be more clever about similar error messages
  //  ie. "Identifier '__' has already been declared"
  const parseErrors = jsFiles
    .filter((file) => file.parseError)
    .map((file) => file.parseError)
    .reduce((all, next) => {
      if (all[next.name] && all[next.name][next.message]) {
        all[next.name][next.message]++;
      } else {
        all[next.name] || (all[next.name] = {});
        all[next.name][next.message] = 1;
      }
      return all;
    }, {});
  if (Object.keys(parseErrors).length > 0) {
    summary.parseErrors = parseErrors;
  }

  // --- summarize comments ---
  const commentsSummary = jsFiles
    .map((file) => file.comments)
    .filter((comments) => comments)
    .reduce((all, next) => {
      for (const key in next) {
        all[key] = all[key] ? all[key] + next[key] : next[key];
      }
      return all;
    }, {});
  if (Object.keys(commentsSummary).length > 0) {
    summary.comments = commentsSummary;
  }

  // --- summarize node types ---
  summary.nodeTypes = jsFiles
    .filter((file) => file.nodeTypes)
    .flatMap((file) => Object.entries(file.nodeTypes))
    .reduce((all, next) => {
      all[next[0]] = all[next[0]] ? all[next[0]] + next[1] : next[1];
      return all;
    }, {});

  // --- summarize identifiers ---
  summary.identifiers = jsFiles
    .filter((file) => file.identifiers)
    .flatMap((file) => Object.entries(file.identifiers))
    .reduce((all, next) => {
      all[next[0]] = all[next[0]] ? all[next[0]] + next[1] : next[1];
      return all;
    }, {});

  // --- summarize literals ---
  summary.literals = jsFiles
    .filter((file) => file.literals)
    .flatMap((file) => Object.entries(file.literals))
    .reduce((all, next) => {
      all[next[0]] = all[next[0]] ? all[next[0]] + next[1] : next[1];
      return all;
    }, {});

  return summary;
};
