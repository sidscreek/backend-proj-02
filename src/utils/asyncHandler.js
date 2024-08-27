
//using Promise
const asyncHandler = (requestHandler) => {
    return (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }

}

//this async handler will be a high order function
//it is a wrapper funciton that will be used everywhere using try catch
// const asyncHnadler = (fn) => async (req,res,next) => {
//     try {
//         await fn(req,res,next);
        
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }

// }
export {asyncHandler}