import formidable from "formidable";
import fs from "fs";
import path from "path";

export const config = {
    api: {
        bodyParser: false, // Matikan bodyParser bawaan Next.js
    },
};

export function parseForm(req) {
    const form = formidable({ multiples: false, uploadDir: "./public/uploads", keepExtensions: true });

    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            resolve({ fields, files });
        });
    });
}
