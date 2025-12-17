// import { ERROR_MESSAGES } from "../errors/errorCodes";
import { toast } from "@/hooks/use-toast";

export function handleApiError(errorResponse: any) {
    // const errorCode = errorResponse?.error;
    // ERROR_MESSAGES[errorCode] ||
    // console.log(errorResponse) 
    // errorResponse?.message ||

    const message =
        (typeof errorResponse === "object") ? errorResponse.message :
        "Ocorreu um erro inesperado.";
    toast({
        title: "Erro",
        description: message,
        variant: "destructive",
    });

    return message;
}
