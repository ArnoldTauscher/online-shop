import formidable from "formidable";

const parseForm = (req, res, next) => {
  const form = formidable({ multiples: true });
  form.parse(req, (err, fields, files) => {
    if (err) return next(err);

    // Felder mit nur einem Wert aus Array extrahieren
    Object.keys(fields).forEach((key) => {
      if (Array.isArray(fields[key]) && fields[key].length === 1) {
        fields[key] = fields[key][0];
      }
    });

    req.body = fields;
    req.files = files;
    next();
  });
};

export default parseForm;
