
export class InvitacionesController {

    static async testing(req, res) {
        console.log("probando endpoint")
        return res.status(200).json({ message: "Todo okey" })
    }

}