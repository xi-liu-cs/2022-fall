import pandas as pd
import numpy as np

df = pd.read_csv('spambase/spambase.data')
df

y = df.iloc[:, -1:] # last column in spambase.data is the label (y) for training the model, read last column from df
y = np.array(y).ravel()
x = df.iloc[: , :-1] # before train the model, remove label from data, remove last column from df
x = x.copy()
x = np.array(x) # transfer df to array

from sklearn.model_selection import train_test_split

x_train, x_test, y_train, y_test = train_test_split(x, y, test_size = 0.3, train_size = 0.7, random_state = 0) # split dataset into train and test dataset paired with its label
"""print(x_train.shape)
print(x_test.shape)
print(y_train.shape)
print(y_test.shape)"""

from sklearn.preprocessing import StandardScaler
scaler = StandardScaler().fit(x_train)
x_train = scaler.transform(x_train)
x_test = scaler.transform(x_test)

from sklearn.tree import DecisionTreeClassifier
from sklearn import metrics
import random
n = 20
start, end = 0, 1000
def decision_tree(criterion):
    print(criterion)
    a = []
    for i in range(n):
        classifier = DecisionTreeClassifier(criterion = criterion, random_state = random.randint(start, end))
        classifier = classifier.fit(x_train, y_train)
        y_predict = classifier.predict(x_test)
        accuracy = metrics.accuracy_score(y_test, y_predict)
        # print(i + 1, 'accuracy:', accuracy)
        a.append(accuracy)
    print(max(a), '\n')

decision_tree('gini')
decision_tree('entropy')