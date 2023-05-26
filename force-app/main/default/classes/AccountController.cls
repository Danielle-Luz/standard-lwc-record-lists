public without sharing class AccountController {
    @AuraEnabled
    public static List<Account> getAccountList(){
        try {
            List<Account> accountList = [SELECT Id, Description, Name, Rating, Phone, Type  FROM Account];

            return accountList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String deleteAccountRecords(List<String> recordsId){
        String deleteOperationErrors = '';

        if(Schema.sObjectType.Account.isDeletable()) {
            List<Account> recordsToBeDeleted = [SELECT Id FROM Account WHERE Id IN :recordsId];

            Database.DeleteResult[] deleteOperationResults = Database.delete(recordsToBeDeleted, false);

            for(Database.DeleteResult deleteResult : deleteOperationResults) {
                for(Database.Error deleteError : deleteResult.getErrors()) {
                    deleteOperationErrors += deleteError.getMessage();
                }
            }
        } else {
            deleteOperationErrors += 'The user can\'t delete account records';
        }

        return deleteOperationErrors;
    }
}