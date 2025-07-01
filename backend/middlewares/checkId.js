import { isValidObjectId } from "mongoose";

function checkId(req, res, next) {
  const id = req.params.userId || req.params.productId;
  if (!id || !isValidObjectId(id)) {
    return res.status(404).json({ message: `Invalid Object of ${id}` });
  }
  next();
}

export default checkId;
