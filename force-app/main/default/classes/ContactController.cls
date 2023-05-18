public without sharing class ContactController {
    @AuraEnabled
    public static List<Contact> getContactList(String searchedName){
        String formattedSearchedName = '%' + searchedName + '%';

        try {
            List<Contact> contactList = [SELECT Id, AccountId, CreatedDate, Email, Name, OwnerId, Phone, Title FROM Contact WHERE Name LIKE :formattedSearchedName];

            return contactList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
    
    @AuraEnabled
    public static void deleteContactRecords(List<String> recordsId){
        try {
            if(Schema.sObjectType.Contact.isDeletable()) {
                List<Contact> recordsToBeDeleted = [SELECT Id FROM Contact WHERE Id IN :recordsId];

                CaseController.removeDeletedContactFromCases(recordsId);

                delete recordsToBeDeleted;
            }
        } catch (Exception e) {
            System.debug(e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }


}