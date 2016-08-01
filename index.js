"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const cheerio = require("cheerio");
const program = require("commander");
const fetch = require("isomorphic-fetch");
const pkg = require("./package.json");
const stdout = process.stdout;
const getPageBody = function (uri) {
    return fetch(uri)
        .then(res => res.text())
        .catch(err => err);
};
const getUserPackageList = function (user) {
    return __awaiter(this, void 0, void 0, function* () {
        const packageListUri = `https://www.npmjs.com/~${user}`;
        const packageListBody = yield getPageBody(packageListUri);
        const $ = cheerio.load(packageListBody);
        const packageList = Array.from($('.collaborated-packages li').map((index, el) => {
            return $(el).find('a').html();
        }));
        return packageList;
    });
};
const getPackageDetail = function (packageName) {
    return __awaiter(this, void 0, void 0, function* () {
        const packageDetailUri = `https://www.npmjs.com/package/${packageName}`;
        const packageDetailBody = yield getPageBody(packageDetailUri);
        const $ = cheerio.load(packageDetailBody);
        let packageDetail = {};
        $('ul.box').eq(1).find('li')
            .each((index, el) => {
            if (!$(el).attr('id')) {
                const container = $(el).find('strong');
                const key = container.attr('class').split(' ').pop().replace(/-.*$/, '');
                packageDetail[key] = container.html();
            }
        });
        return {
            packageName: packageName,
            packageDetail: packageDetail
        };
    });
};
const getUserPackageDetail = function (packageList) {
    return __awaiter(this, void 0, void 0, function* () {
        const userPackageDetail = yield Promise.all(packageList.map(packageName => getPackageDetail(packageName)));
        return userPackageDetail;
    });
};
program
    .version(pkg.version)
    .usage('[command]');
program
    .command('user <user>')
    .description('search user packageList')
    .action(user => {
    getUserPackageList(user)
        .then(packageList => getUserPackageDetail(packageList))
        .then(list => {
        stdout.write(`${user}'s packageList: \n`);
        list.forEach((item) => {
            stdout.write(`    package: ${item.packageName}: \n`);
            stdout.write(`        `);
            Object.keys(item.packageDetail).forEach(key => {
                const value = item.packageDetail[key];
                stdout.write(`${key}: ${value} `);
            });
            stdout.write('\n');
        });
    })
        .catch(err => {
        process.stdout.write(`search user packageList failed: ${err.message}`);
    });
});
program.parse(process.argv);
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map