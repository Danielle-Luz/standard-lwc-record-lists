
import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import DeleteRecordsModal from 'c/deleteRecordsModal';
import ErrorModal from 'c/errorModal';
import getContactList from '@salesforce/apex/ContactController.getContactList';
import getAccountList from '@salesforce/apex/AccountController.getAccountList';
import getCaseList from '@salesforce/apex/CaseController.getCaseList';
import deleteContactRecords from '@salesforce/apex/ContactController.deleteContactRecords';
import deleteAccountRecords from '@salesforce/apex/AccountController.deleteAccountRecords';
import deleteCaseRecords from '@salesforce/apex/CaseController.deleteCaseRecords';

export default class RecordsList extends LightningElement {
    @api
    objectApiName;

    @track
    data = {};

    columns = [];

    numberOfRowsDisplayed = 10;

    dataIsLoading;

    allRecords;

    @track
    filteredRecords;

    recordsPageNumber;

    selectedRecords;

    objectMethods = {
    Account: {
        deleteRecordsMethod: deleteAccountRecords,
        getRecordsMethod: getAccountList
    },
    Contact: {
        deleteRecordsMethod: deleteContactRecords,
        getRecordsMethod: getContactList
    },
    Case: {
        deleteRecordsMethod: deleteCaseRecords,
        getRecordsMethod: getCaseList
    },
}

    get objectIcon() {
        const iconName = "standard:" + this.objectApiName.toLowerCase();

        return iconName;
    }

    get isObjectDataEmpty() {
        const objectIsEmpty = Object.keys(this.data).length == 0;

        return objectIsEmpty;
    }

    get isTheMaxPage() {
        const maxPageNumber = (this.filteredRecords.length / this.numberOfRowsDisplayed) - 1;

        return this.recordsPageNumber >= maxPageNumber;
    }

    get isTheMinPage() {
        const minPageNumber = 0;

        return this.recordsPageNumber == minPageNumber;
    }

    get toggleDeleteButton() {
        const someRecordWasSelected = this.selectedRecords.length > 0;

        return !someRecordWasSelected;
    }

    async getObjectData() {
        const getObjectRecordsMethod = this.objectMethods[this.objectApiName].getRecordsMethod;

        this.dataIsLoading = true;

        try {
            const allObjectRecords = await getObjectRecordsMethod();

            this.allRecords = allObjectRecords;
            
            this.showRecordsInSpecificPage(allObjectRecords);

            this.selectedRecords = [];
        } catch(error) {
            console.error(error);

            const errorToast = new ShowToastEvent({
                title: `Could not load records from ${this.objectApiName} object`,
                variant: "error"
            });

            this.dispatchEvent(errorToast);
        } finally {
            this.dataIsLoading = false;

            this.template.querySelector("lightning-datatable").selectedRows = [];
        }
    }

    showRecordsInSpecificPage(filteredRecords) {
        if(filteredRecords != undefined) {
            this.recordsPageNumber = 0;

            this.filteredRecords = filteredRecords;
        }

        const firstRecordInPageIndex = this.recordsPageNumber * this.numberOfRowsDisplayed;
        const lastRecordInPageIndex = firstRecordInPageIndex + this.numberOfRowsDisplayed;

        const setOfRecordsToBeShown = this.filteredRecords.slice(firstRecordInPageIndex, lastRecordInPageIndex);

        this.data = setOfRecordsToBeShown;
    }

    getRecordsInTheNextPage() {
        if (!this.isTheMaxPage) {
            this.recordsPageNumber += 1;

            this.showRecordsInSpecificPage();
        }
    }

    getRecordsInThePreviousPage() {
        if (!this.isTheMinPage) {
            this.recordsPageNumber -= 1;

            this.showRecordsInSpecificPage();
        }
    }

    searchRecords() {
        const searchInput = this.template.querySelector("[data-id='search-input']");
        const searchedValue = searchInput.value.toLowerCase();

        const foundRecords = this.allRecords.filter(recordData => {
            const allRecordFieldValues = JSON.parse(JSON.stringify(Object.values(recordData)));
            
            const someFieldHasTheSearchedValue = allRecordFieldValues.some(fieldValue => {
                const fieldIsNestedObject = typeof fieldValue === 'object';

                if(fieldIsNestedObject) {
                    const nestedObjectFieldValues = Object.values(fieldValue);

                    allRecordFieldValues.push([...nestedObjectFieldValues]);
                    
                    return false;
                }

                return new String(fieldValue).toLowerCase().includes(searchedValue);
            });
            
            return someFieldHasTheSearchedValue;
        });

        this.showRecordsInSpecificPage(foundRecords);
    }

    clearSearch() {
        this.showRecordsInSpecificPage(this.allRecords);
    }

    addManageRecordMenu() {
        const menuMetadata = {
            type: "action",
            typeAttributes: {
                rowActions: [
                    {
                        label: "Open record",
                        name: "view"
                    }
                ],
                menuAlignment: "right"
            }
        }

        this.columns.push(menuMetadata);
    }

    openRecordInNewWindow(recordId) {
        const recordUrl = `/lightning/r/${this.objectApiName}/${recordId}/view`;

        window.open(recordUrl);
    }

    handleRecordMenuActions(event) {
        const clickedActionName = event.detail.action.name;
        const selectedRecordId = event.detail.row.Id;

        switch (clickedActionName) {
            case "view":
                this.openRecordInNewWindow(selectedRecordId);

                break;
        }
    }

    updateSelectedRecordsList(event) {
        this.selectedRecords = event.detail.selectedRows;
    }

    async deleteSelectedRecords(event) {
        const userChooseToDeleteRecords = await this.openDeleteModal();
        
        if(userChooseToDeleteRecords) {
            const deleteRecords = this.objectMethods[this.objectApiName].deleteRecordsMethod;

            const selectedRecordsIds = this.selectedRecords.map(record => {
                return record.Id
            });

            const allErrorMessagesAsString = await deleteRecords({ recordsId: selectedRecordsIds });

            const recordsQuantityBeforeDeletion = this.allRecords.length;

            if(allErrorMessagesAsString != "") {
                const deleteErrorMessagesList = allErrorMessagesAsString.split(/\n/g).map(errorMessage => {
                    return { errorMessage };
                });
                
                await ErrorModal.open({ deleteErrorMessagesList });
            }

            await this.getObjectData();

            if(this.allRecords.length != recordsQuantityBeforeDeletion) {
                const successToast = new ShowToastEvent({
                    title: "The records not related to other records were successfully deleted",
                    variant: "success"
                });
    
                this.dispatchEvent(successToast);
            }
        }
    }

    openDeleteModal() {
        const deleteModalMetadata = {
            label: `Delete ${this.objectApiName}'s records`,
            title: `Do you want to delete these ${this.objectApiName.toLowerCase()}s? `
        };

        const userChooseToDeleteRecords = DeleteRecordsModal.open(deleteModalMetadata);

        return userChooseToDeleteRecords;
    }

    connectedCallback() {
        this.getObjectData();
    }

    @wire(getObjectInfo, { objectApiName: "$objectApiName" })
    getObjectColumns({ data, error }) {
        if (data) {
            console.log(this.objectApiName);
            console.log(data);
            const selectedFieldsApiNames = ["Name", "Department", "Title", "Phone", "Email", "Level", "Description", "Rating", "CaseNumber", "Type", "ContactEmail", "Status", "IsClosed", "ClosedDate", "Priority", "Level", "Subject"];

            for (let objectFieldName in data.fields) {
                const fieldMetadata = data.fields[objectFieldName];

                if (!selectedFieldsApiNames.includes(fieldMetadata["apiName"])) {
                    continue;
                }

                const label = fieldMetadata["label"];
                const fieldName = fieldMetadata["apiName"];
                const type = fieldMetadata["dataType"];

                const newColumn = { label, fieldName, type };

                this.columns = [...this.columns, newColumn];
            };

            this.addManageRecordMenu();
        } else if (error) {
            console.error(error);

            const errorToast = new ShowToastEvent({
                title: `Could not load datatable columns for ${this.objectApiName} object`,
                variant: "error"
            });

            this.dispatchEvent(errorToast);
        }
    };
}