import LightningModal from 'lightning/modal';
import { api } from 'lwc';


export default class DeleteRecordsModal extends LightningModal {
  @api
  label;

  @api
  title;

  getUserChoiceAboutRecordsDeletion(event) {
    const clickedButtonId = event.target.getAttribute("data-id");

    const deleteButtonWasCliked = clickedButtonId == "delete-button";

    this.close(deleteButtonWasCliked);
  }
}