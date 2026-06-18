"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            const parsed = await schema.safeParseAsync(req.body);
            if (!parsed.success) {
                res.status(400).json({
                    success: false,
                    error: {
                        message: "Validation failed",
                        details: parsed.error.format(),
                    },
                });
                return;
            }
            req.body = parsed.data;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.validate = validate;
exports.default = exports.validate;
