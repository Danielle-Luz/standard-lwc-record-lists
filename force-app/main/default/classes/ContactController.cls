public without sharing class ContactController {
    @AuraEnabled
    public static List<Contact> getContactList(){
        try {
            List<Contact> contactList = [SELECT Id, Department, Description, Email, Level__c, Name, Phone, Title FROM Contact];

            return contactList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static String deleteContactRecords(List<String> recordsId){
        String deleteOperationErrors = '';

        if(Schema.sObjectType.Contact.isDeletable()) {
            List<Contact> recordsToBeDeleted = [SELECT Id FROM Contact WHERE Id IN :recordsId];

            Database.DeleteResult[] deleteOperationResults = Database.delete(recordsToBeDeleted, false);

            for(Database.DeleteResult deleteResult : deleteOperationResults) {
                for(Database.Error deleteError : deleteResult.getErrors()) {
                    deleteOperationErrors += deleteError.getMessage();
                }
            }
        } else {
            deleteOperationErrors += 'The user can\'t delete contact records';
        }

        return deleteOperationErrors;
    }
}