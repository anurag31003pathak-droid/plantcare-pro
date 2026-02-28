import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
import matplotlib.pyplot as plt

# Configuration
IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 20
NUM_CLASSES = 38
DATASET_DIR = "dataset" # Assume dataset is in this directory
MODEL_SAVE_PATH = "plantcare_model.h5"

def build_model(num_classes):
    # Load MobileNetV2 pre-trained on ImageNet without the top classification layer
    base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=IMG_SIZE + (3,))
    
    # Freeze the base model
    base_model.trainable = False

    # Add custom classification head
    x = base_model.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(256, activation='relu')(x)
    x = Dropout(0.5)(x)
    predictions = Dense(num_classes, activation='softmax')(x)

    model = Model(inputs=base_model.input, outputs=predictions)
    return model

def create_datasets(data_dir):
    # Data Augmentation & Preprocessing
    train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
        rescale=1./255,
        rotation_range=20,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.2,
        horizontal_flip=True,
        fill_mode='nearest',
        validation_split=0.3 # 70% train, 30% for val/test (we'll split the 30% into 15/15 later if needed, but standard generator uses val split directly)
    )

    # Note: For proper 70/15/15 split, you typically need to organize folders manually or write custom generator logic.
    # We use 80/20 here for simplicity with ImageDataGenerator, but you can adjust.
    train_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='training'
    )

    val_generator = train_datagen.flow_from_directory(
        data_dir,
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode='categorical',
        subset='validation'
    )
    
    return train_generator, val_generator

def plot_history(history):
    acc = history.history['accuracy']
    val_acc = history.history['val_accuracy']
    loss = history.history['loss']
    val_loss = history.history['val_loss']

    epochs_range = range(len(acc))

    plt.figure(figsize=(12, 6))
    plt.subplot(1, 2, 1)
    plt.plot(epochs_range, acc, label='Training Accuracy')
    plt.plot(epochs_range, val_acc, label='Validation Accuracy')
    plt.legend(loc='lower right')
    plt.title('Training and Validation Accuracy')

    plt.subplot(1, 2, 2)
    plt.plot(epochs_range, loss, label='Training Loss')
    plt.plot(epochs_range, val_loss, label='Validation Loss')
    plt.legend(loc='upper right')
    plt.title('Training and Validation Loss')
    plt.savefig('training_history.png')
    plt.show()

def main():
    if not os.path.exists(DATASET_DIR):
        print(f"Error: Dataset directory '{DATASET_DIR}' not found. Please create it and add image classes.")
        # Create a dummy structure for demonstration so the script doesn't completely fail if someone runs it empty
        os.makedirs(os.path.join(DATASET_DIR, "dummy_class"), exist_ok=True)
        print("Created a dummy directory structure.")
        return
        
    print("Loading data...")
    train_generator, val_generator = create_datasets(DATASET_DIR)
    
    # Update NUM_CLASSES based on actual found classes
    num_classes = train_generator.num_classes
    print(f"Found {num_classes} classes.")

    print("Building model...")
    model = build_model(num_classes)
    
    model.compile(optimizer=Adam(learning_rate=0.001), 
                  loss='categorical_crossentropy', 
                  metrics=['accuracy'])

    # Callbacks
    checkpoint = ModelCheckpoint(MODEL_SAVE_PATH, monitor='val_accuracy', verbose=1, save_best_only=True, mode='max')
    early_stop = EarlyStopping(monitor='val_loss', patience=5, verbose=1, restore_best_weights=True)
    reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.2, patience=3, verbose=1, min_lr=0.00001)

    print("Starting training...")
    history = model.fit(
        train_generator,
        epochs=EPOCHS,
        validation_data=val_generator,
        callbacks=[checkpoint, early_stop, reduce_lr]
    )
    
    print("Fine-tuning top layers...")
    # Unfreeze the base model
    base_model = model.layers[0]
    base_model.trainable = True

    # Freeze all layers except the top 20
    for layer in base_model.layers[:-20]:
        layer.trainable = False
        
    # Recompile with a lower learning rate for fine-tuning
    model.compile(optimizer=Adam(learning_rate=0.0001), 
                  loss='categorical_crossentropy', 
                  metrics=['accuracy'])
                  
    history_fine = model.fit(
        train_generator,
        epochs=EPOCHS // 2,
        validation_data=val_generator,
        callbacks=[checkpoint, early_stop, reduce_lr]
    )

    print(f"Training complete. Model saved to {MODEL_SAVE_PATH}")
    plot_history(history_fine)

if __name__ == "__main__":
    main()
