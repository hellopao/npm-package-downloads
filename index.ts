#!/usr/bin/env node
"use strict";

import * as cheerio from "cheerio";
import * as program from "commander";
import * as fetch from "isomorphic-fetch";

const pkg = require("./package.json");

const stdout = process.stdout;

const getPageBody = function (uri) {
    return fetch(uri)
        .then(res => res.text())
        .catch(err => err);
};

const getUserPackageList = async function (user) {
    const packageListUri = `https://www.npmjs.com/~${user}`;
    const packageListBody = await getPageBody(packageListUri);

    const $ = cheerio.load(packageListBody);

    const packageList = Array.from($('.collaborated-packages li').map((index, el) => {
        return $(el).find('a').html();
    }));

    return packageList;
};

const getPackageDetail = async function (packageName) {
    const packageDetailUri = `https://www.npmjs.com/package/${packageName}`;
    const packageDetailBody = await getPageBody(packageDetailUri);

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
        packageName,
        packageDetail
    };
};

const getUserPackageDetail = async function (packageList) {
    const userPackageDetail = await Promise.all(packageList.map(packageName => getPackageDetail(packageName)));
    return userPackageDetail;
};



program
    .version(pkg.version)
    .usage('[command]')

program
    .command('user <user>')
    .description('search user packageList')
    .action(user => {
        getUserPackageList(user)
            .then(packageList => getUserPackageDetail(packageList))
            .then(list => {
                stdout.write(`${user}'s packageList: \n`);
                list.forEach((item: {
                    packageName: string;
                    packageDetail: {
                        [key: string]: string;
                    }
                }) => {
                    stdout.write(`    package: ${item.packageName}: \n`);
                    stdout.write(`        `)
                    Object.keys(item.packageDetail).forEach(key => {
                        const value = item.packageDetail[key];
                        stdout.write(`${key}: ${value} `);
                    });
                    stdout.write('\n');
                })
            })
            .catch(err => {
                process.stdout.write(`search user packageList failed: ${err.message}`)
            })
    })

program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
}