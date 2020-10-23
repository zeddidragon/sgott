import csv

def whatType(item):
    return type(item)

def checkMatrix(matrix):
    prevList = None
    mi = 0
    for a in matrix:
        err=0
        li = 0

        if a[0] is not 0:

            for i in a:                

                if li is 0:
                    pass
                else:
                    curItem = whatType(i)
                    #print("The item in list",mi+1,"at position", li, "is a", curItem)

                    if prevList is None:
                        pass
                    else:
                        prevItem = whatType(prevList[li])
                        if prevItem != curItem:
                            print("\nThe item in list", mi+1, "at position", li,
                                "does not match the type of the item in the same position of the previous list!\nthe previous item was",
                                prevItem, "but the current item is", curItem)
                            err=err+1
                        else:
                            pass
                            #print("The current and previous items match!")
                li = li+1

        else:
            print("We ignored the list at position", mi+1)
            li = li+1

        if err < 1:
            print("All items in list",mi+1,"matched the previous list")
        else:
            print("The list at row",mi+1,"contained",err,"type errors\n")

        prevList = a
        mi = mi+1

realSheet = []

with open("rebalance/The EDF 4.1 Rebalance Project - Gun Rebalance.csv",encoding="utf8") as csvDataFile:
    csvReader = csv.reader(csvDataFile)
    for row in csvReader:
        #print(row)
        realSheet.append(row)

#testMatrix = [[1, 1, "APPLE", 3], [1, 2, 3, 4], [1, 3, "four", 5], [0, "I am a", "Test ignore", "Row"]]

checkMatrix(realSheet)
