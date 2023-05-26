import { api } from 'lwc';
import LightningModal from 'lightning/modal';

export default class ErrorModal extends LightningModal {
    @api
    deleteErrorMessagesList;

    columns = [{ label: "Error", fieldName: "errorMessage", type: "text", wrapText: true, hideDefaultActions: true }];
}