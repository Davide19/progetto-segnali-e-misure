(function () {
    'use strict';

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class Deferred {
        constructor() {
            this.reject = () => { };
            this.resolve = () => { };
            this.promise = new Promise((resolve, reject) => {
                this.resolve = resolve;
                this.reject = reject;
            });
        }
        /**
         * Our API internals are not promiseified and cannot because our callback APIs have subtle expectations around
         * invoking promises inline, which Promises are forbidden to do. This method accepts an optional node-style callback
         * and returns a node-style callback which will resolve or reject the Deferred's promise.
         */
        wrapCallback(callback) {
            return (error, value) => {
                if (error) {
                    this.reject(error);
                }
                else {
                    this.resolve(value);
                }
                if (typeof callback === 'function') {
                    // Attaching noop handler just in case developer wasn't expecting
                    // promises
                    this.promise.catch(() => { });
                    // Some of our callbacks don't expect a value and our own tests
                    // assert that the parameter length is 1
                    if (callback.length === 1) {
                        callback(error);
                    }
                    else {
                        callback(error, value);
                    }
                }
            };
        }
    }
    function isBrowserExtension() {
        const runtime = typeof chrome === 'object'
            ? chrome.runtime
            : typeof browser === 'object'
                ? browser.runtime
                : undefined;
        return typeof runtime === 'object' && runtime.id !== undefined;
    }
    /**
     * This method checks if indexedDB is supported by current browser/service worker context
     * @return true if indexedDB is supported by current browser/service worker context
     */
    function isIndexedDBAvailable() {
        return typeof indexedDB === 'object';
    }
    /**
     * This method validates browser/sw context for indexedDB by opening a dummy indexedDB database and reject
     * if errors occur during the database open operation.
     *
     * @throws exception if current browser/sw context can't run idb.open (ex: Safari iframe, Firefox
     * private browsing)
     */
    function validateIndexedDBOpenable() {
        return new Promise((resolve, reject) => {
            try {
                let preExist = true;
                const DB_CHECK_NAME = 'validate-browser-context-for-indexeddb-analytics-module';
                const request = self.indexedDB.open(DB_CHECK_NAME);
                request.onsuccess = () => {
                    request.result.close();
                    // delete database only when it doesn't pre-exist
                    if (!preExist) {
                        self.indexedDB.deleteDatabase(DB_CHECK_NAME);
                    }
                    resolve(true);
                };
                request.onupgradeneeded = () => {
                    preExist = false;
                };
                request.onerror = () => {
                    var _a;
                    reject(((_a = request.error) === null || _a === void 0 ? void 0 : _a.message) || '');
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     *
     * This method checks whether cookie is enabled within current browser
     * @return true if cookie is enabled within current browser
     */
    function areCookiesEnabled() {
        if (typeof navigator === 'undefined' || !navigator.cookieEnabled) {
            return false;
        }
        return true;
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @fileoverview Standardized Firebase Error.
     *
     * Usage:
     *
     *   // Typescript string literals for type-safe codes
     *   type Err =
     *     'unknown' |
     *     'object-not-found'
     *     ;
     *
     *   // Closure enum for type-safe error codes
     *   // at-enum {string}
     *   var Err = {
     *     UNKNOWN: 'unknown',
     *     OBJECT_NOT_FOUND: 'object-not-found',
     *   }
     *
     *   let errors: Map<Err, string> = {
     *     'generic-error': "Unknown error",
     *     'file-not-found': "Could not find file: {$file}",
     *   };
     *
     *   // Type-safe function - must pass a valid error code as param.
     *   let error = new ErrorFactory<Err>('service', 'Service', errors);
     *
     *   ...
     *   throw error.create(Err.GENERIC);
     *   ...
     *   throw error.create(Err.FILE_NOT_FOUND, {'file': fileName});
     *   ...
     *   // Service: Could not file file: foo.txt (service/file-not-found).
     *
     *   catch (e) {
     *     assert(e.message === "Could not find file: foo.txt.");
     *     if (e.code === 'service/file-not-found') {
     *       console.log("Could not read file: " + e['file']);
     *     }
     *   }
     */
    const ERROR_NAME = 'FirebaseError';
    // Based on code from:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error#Custom_Error_Types
    class FirebaseError extends Error {
        constructor(code, message, customData) {
            super(message);
            this.code = code;
            this.customData = customData;
            this.name = ERROR_NAME;
            // Fix For ES5
            // https://github.com/Microsoft/TypeScript-wiki/blob/master/Breaking-Changes.md#extending-built-ins-like-error-array-and-map-may-no-longer-work
            Object.setPrototypeOf(this, FirebaseError.prototype);
            // Maintains proper stack trace for where our error was thrown.
            // Only available on V8.
            if (Error.captureStackTrace) {
                Error.captureStackTrace(this, ErrorFactory.prototype.create);
            }
        }
    }
    class ErrorFactory {
        constructor(service, serviceName, errors) {
            this.service = service;
            this.serviceName = serviceName;
            this.errors = errors;
        }
        create(code, ...data) {
            const customData = data[0] || {};
            const fullCode = `${this.service}/${code}`;
            const template = this.errors[code];
            const message = template ? replaceTemplate(template, customData) : 'Error';
            // Service Name: Error message (service/code).
            const fullMessage = `${this.serviceName}: ${message} (${fullCode}).`;
            const error = new FirebaseError(fullCode, fullMessage, customData);
            return error;
        }
    }
    function replaceTemplate(template, data) {
        return template.replace(PATTERN, (_, key) => {
            const value = data[key];
            return value != null ? String(value) : `<${key}?>`;
        });
    }
    const PATTERN = /\{\$([^}]+)}/g;
    /**
     * Deep equal two objects. Support Arrays and Objects.
     */
    function deepEqual(a, b) {
        if (a === b) {
            return true;
        }
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        for (const k of aKeys) {
            if (!bKeys.includes(k)) {
                return false;
            }
            const aProp = a[k];
            const bProp = b[k];
            if (isObject$1(aProp) && isObject$1(bProp)) {
                if (!deepEqual(aProp, bProp)) {
                    return false;
                }
            }
            else if (aProp !== bProp) {
                return false;
            }
        }
        for (const k of bKeys) {
            if (!aKeys.includes(k)) {
                return false;
            }
        }
        return true;
    }
    function isObject$1(thing) {
        return thing !== null && typeof thing === 'object';
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The amount of milliseconds to exponentially increase.
     */
    const DEFAULT_INTERVAL_MILLIS = 1000;
    /**
     * The factor to backoff by.
     * Should be a number greater than 1.
     */
    const DEFAULT_BACKOFF_FACTOR = 2;
    /**
     * The maximum milliseconds to increase to.
     *
     * <p>Visible for testing
     */
    const MAX_VALUE_MILLIS = 4 * 60 * 60 * 1000; // Four hours, like iOS and Android.
    /**
     * The percentage of backoff time to randomize by.
     * See
     * http://go/safe-client-behavior#step-1-determine-the-appropriate-retry-interval-to-handle-spike-traffic
     * for context.
     *
     * <p>Visible for testing
     */
    const RANDOM_FACTOR = 0.5;
    /**
     * Based on the backoff method from
     * https://github.com/google/closure-library/blob/master/closure/goog/math/exponentialbackoff.js.
     * Extracted here so we don't need to pass metadata and a stateful ExponentialBackoff object around.
     */
    function calculateBackoffMillis(backoffCount, intervalMillis = DEFAULT_INTERVAL_MILLIS, backoffFactor = DEFAULT_BACKOFF_FACTOR) {
        // Calculates an exponentially increasing value.
        // Deviation: calculates value from count and a constant interval, so we only need to save value
        // and count to restore state.
        const currBaseValue = intervalMillis * Math.pow(backoffFactor, backoffCount);
        // A random "fuzz" to avoid waves of retries.
        // Deviation: randomFactor is required.
        const randomWait = Math.round(
        // A fraction of the backoff value to add/subtract.
        // Deviation: changes multiplication order to improve readability.
        RANDOM_FACTOR *
            currBaseValue *
            // A random float (rounded to int by Math.round above) in the range [-1, 1]. Determines
            // if we add or subtract.
            (Math.random() - 0.5) *
            2);
        // Limits backoff to max to avoid effectively permanent backoff.
        return Math.min(MAX_VALUE_MILLIS, currBaseValue + randomWait);
    }

    /**
     * @license
     * Copyright 2021 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function getModularInstance(service) {
        if (service && service._delegate) {
            return service._delegate;
        }
        else {
            return service;
        }
    }

    /**
     * Component for service name T, e.g. `auth`, `auth-internal`
     */
    class Component {
        /**
         *
         * @param name The public service name, e.g. app, auth, firestore, database
         * @param instanceFactory Service factory responsible for creating the public interface
         * @param type whether the service provided by the component is public or private
         */
        constructor(name, instanceFactory, type) {
            this.name = name;
            this.instanceFactory = instanceFactory;
            this.type = type;
            this.multipleInstances = false;
            /**
             * Properties to be added to the service namespace
             */
            this.serviceProps = {};
            this.instantiationMode = "LAZY" /* LAZY */;
            this.onInstanceCreated = null;
        }
        setInstantiationMode(mode) {
            this.instantiationMode = mode;
            return this;
        }
        setMultipleInstances(multipleInstances) {
            this.multipleInstances = multipleInstances;
            return this;
        }
        setServiceProps(props) {
            this.serviceProps = props;
            return this;
        }
        setInstanceCreatedCallback(callback) {
            this.onInstanceCreated = callback;
            return this;
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const DEFAULT_ENTRY_NAME$1 = '[DEFAULT]';

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Provider for instance for service name T, e.g. 'auth', 'auth-internal'
     * NameServiceMapping[T] is an alias for the type of the instance
     */
    class Provider {
        constructor(name, container) {
            this.name = name;
            this.container = container;
            this.component = null;
            this.instances = new Map();
            this.instancesDeferred = new Map();
            this.instancesOptions = new Map();
            this.onInitCallbacks = new Map();
        }
        /**
         * @param identifier A provider can provide mulitple instances of a service
         * if this.component.multipleInstances is true.
         */
        get(identifier) {
            // if multipleInstances is not supported, use the default name
            const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
            if (!this.instancesDeferred.has(normalizedIdentifier)) {
                const deferred = new Deferred();
                this.instancesDeferred.set(normalizedIdentifier, deferred);
                if (this.isInitialized(normalizedIdentifier) ||
                    this.shouldAutoInitialize()) {
                    // initialize the service if it can be auto-initialized
                    try {
                        const instance = this.getOrInitializeService({
                            instanceIdentifier: normalizedIdentifier
                        });
                        if (instance) {
                            deferred.resolve(instance);
                        }
                    }
                    catch (e) {
                        // when the instance factory throws an exception during get(), it should not cause
                        // a fatal error. We just return the unresolved promise in this case.
                    }
                }
            }
            return this.instancesDeferred.get(normalizedIdentifier).promise;
        }
        getImmediate(options) {
            var _a;
            // if multipleInstances is not supported, use the default name
            const normalizedIdentifier = this.normalizeInstanceIdentifier(options === null || options === void 0 ? void 0 : options.identifier);
            const optional = (_a = options === null || options === void 0 ? void 0 : options.optional) !== null && _a !== void 0 ? _a : false;
            if (this.isInitialized(normalizedIdentifier) ||
                this.shouldAutoInitialize()) {
                try {
                    return this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                }
                catch (e) {
                    if (optional) {
                        return null;
                    }
                    else {
                        throw e;
                    }
                }
            }
            else {
                // In case a component is not initialized and should/can not be auto-initialized at the moment, return null if the optional flag is set, or throw
                if (optional) {
                    return null;
                }
                else {
                    throw Error(`Service ${this.name} is not available`);
                }
            }
        }
        getComponent() {
            return this.component;
        }
        setComponent(component) {
            if (component.name !== this.name) {
                throw Error(`Mismatching Component ${component.name} for Provider ${this.name}.`);
            }
            if (this.component) {
                throw Error(`Component for ${this.name} has already been provided`);
            }
            this.component = component;
            // return early without attempting to initialize the component if the component requires explicit initialization (calling `Provider.initialize()`)
            if (!this.shouldAutoInitialize()) {
                return;
            }
            // if the service is eager, initialize the default instance
            if (isComponentEager(component)) {
                try {
                    this.getOrInitializeService({ instanceIdentifier: DEFAULT_ENTRY_NAME$1 });
                }
                catch (e) {
                    // when the instance factory for an eager Component throws an exception during the eager
                    // initialization, it should not cause a fatal error.
                    // TODO: Investigate if we need to make it configurable, because some component may want to cause
                    // a fatal error in this case?
                }
            }
            // Create service instances for the pending promises and resolve them
            // NOTE: if this.multipleInstances is false, only the default instance will be created
            // and all promises with resolve with it regardless of the identifier.
            for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
                const normalizedIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
                try {
                    // `getOrInitializeService()` should always return a valid instance since a component is guaranteed. use ! to make typescript happy.
                    const instance = this.getOrInitializeService({
                        instanceIdentifier: normalizedIdentifier
                    });
                    instanceDeferred.resolve(instance);
                }
                catch (e) {
                    // when the instance factory throws an exception, it should not cause
                    // a fatal error. We just leave the promise unresolved.
                }
            }
        }
        clearInstance(identifier = DEFAULT_ENTRY_NAME$1) {
            this.instancesDeferred.delete(identifier);
            this.instancesOptions.delete(identifier);
            this.instances.delete(identifier);
        }
        // app.delete() will call this method on every provider to delete the services
        // TODO: should we mark the provider as deleted?
        async delete() {
            const services = Array.from(this.instances.values());
            await Promise.all([
                ...services
                    .filter(service => 'INTERNAL' in service) // legacy services
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map(service => service.INTERNAL.delete()),
                ...services
                    .filter(service => '_delete' in service) // modularized services
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    .map(service => service._delete())
            ]);
        }
        isComponentSet() {
            return this.component != null;
        }
        isInitialized(identifier = DEFAULT_ENTRY_NAME$1) {
            return this.instances.has(identifier);
        }
        getOptions(identifier = DEFAULT_ENTRY_NAME$1) {
            return this.instancesOptions.get(identifier) || {};
        }
        initialize(opts = {}) {
            const { options = {} } = opts;
            const normalizedIdentifier = this.normalizeInstanceIdentifier(opts.instanceIdentifier);
            if (this.isInitialized(normalizedIdentifier)) {
                throw Error(`${this.name}(${normalizedIdentifier}) has already been initialized`);
            }
            if (!this.isComponentSet()) {
                throw Error(`Component ${this.name} has not been registered yet`);
            }
            const instance = this.getOrInitializeService({
                instanceIdentifier: normalizedIdentifier,
                options
            });
            // resolve any pending promise waiting for the service instance
            for (const [instanceIdentifier, instanceDeferred] of this.instancesDeferred.entries()) {
                const normalizedDeferredIdentifier = this.normalizeInstanceIdentifier(instanceIdentifier);
                if (normalizedIdentifier === normalizedDeferredIdentifier) {
                    instanceDeferred.resolve(instance);
                }
            }
            return instance;
        }
        /**
         *
         * @param callback - a function that will be invoked  after the provider has been initialized by calling provider.initialize().
         * The function is invoked SYNCHRONOUSLY, so it should not execute any longrunning tasks in order to not block the program.
         *
         * @param identifier An optional instance identifier
         * @returns a function to unregister the callback
         */
        onInit(callback, identifier) {
            var _a;
            const normalizedIdentifier = this.normalizeInstanceIdentifier(identifier);
            const existingCallbacks = (_a = this.onInitCallbacks.get(normalizedIdentifier)) !== null && _a !== void 0 ? _a : new Set();
            existingCallbacks.add(callback);
            this.onInitCallbacks.set(normalizedIdentifier, existingCallbacks);
            const existingInstance = this.instances.get(normalizedIdentifier);
            if (existingInstance) {
                callback(existingInstance, normalizedIdentifier);
            }
            return () => {
                existingCallbacks.delete(callback);
            };
        }
        /**
         * Invoke onInit callbacks synchronously
         * @param instance the service instance`
         */
        invokeOnInitCallbacks(instance, identifier) {
            const callbacks = this.onInitCallbacks.get(identifier);
            if (!callbacks) {
                return;
            }
            for (const callback of callbacks) {
                try {
                    callback(instance, identifier);
                }
                catch (_a) {
                    // ignore errors in the onInit callback
                }
            }
        }
        getOrInitializeService({ instanceIdentifier, options = {} }) {
            let instance = this.instances.get(instanceIdentifier);
            if (!instance && this.component) {
                instance = this.component.instanceFactory(this.container, {
                    instanceIdentifier: normalizeIdentifierForFactory(instanceIdentifier),
                    options
                });
                this.instances.set(instanceIdentifier, instance);
                this.instancesOptions.set(instanceIdentifier, options);
                /**
                 * Invoke onInit listeners.
                 * Note this.component.onInstanceCreated is different, which is used by the component creator,
                 * while onInit listeners are registered by consumers of the provider.
                 */
                this.invokeOnInitCallbacks(instance, instanceIdentifier);
                /**
                 * Order is important
                 * onInstanceCreated() should be called after this.instances.set(instanceIdentifier, instance); which
                 * makes `isInitialized()` return true.
                 */
                if (this.component.onInstanceCreated) {
                    try {
                        this.component.onInstanceCreated(this.container, instanceIdentifier, instance);
                    }
                    catch (_a) {
                        // ignore errors in the onInstanceCreatedCallback
                    }
                }
            }
            return instance || null;
        }
        normalizeInstanceIdentifier(identifier = DEFAULT_ENTRY_NAME$1) {
            if (this.component) {
                return this.component.multipleInstances ? identifier : DEFAULT_ENTRY_NAME$1;
            }
            else {
                return identifier; // assume multiple instances are supported before the component is provided.
            }
        }
        shouldAutoInitialize() {
            return (!!this.component &&
                this.component.instantiationMode !== "EXPLICIT" /* EXPLICIT */);
        }
    }
    // undefined should be passed to the service factory for the default instance
    function normalizeIdentifierForFactory(identifier) {
        return identifier === DEFAULT_ENTRY_NAME$1 ? undefined : identifier;
    }
    function isComponentEager(component) {
        return component.instantiationMode === "EAGER" /* EAGER */;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * ComponentContainer that provides Providers for service name T, e.g. `auth`, `auth-internal`
     */
    class ComponentContainer {
        constructor(name) {
            this.name = name;
            this.providers = new Map();
        }
        /**
         *
         * @param component Component being added
         * @param overwrite When a component with the same name has already been registered,
         * if overwrite is true: overwrite the existing component with the new component and create a new
         * provider with the new component. It can be useful in tests where you want to use different mocks
         * for different tests.
         * if overwrite is false: throw an exception
         */
        addComponent(component) {
            const provider = this.getProvider(component.name);
            if (provider.isComponentSet()) {
                throw new Error(`Component ${component.name} has already been registered with ${this.name}`);
            }
            provider.setComponent(component);
        }
        addOrOverwriteComponent(component) {
            const provider = this.getProvider(component.name);
            if (provider.isComponentSet()) {
                // delete the existing provider from the container, so we can register the new component
                this.providers.delete(component.name);
            }
            this.addComponent(component);
        }
        /**
         * getProvider provides a type safe interface where it can only be called with a field name
         * present in NameServiceMapping interface.
         *
         * Firebase SDKs providing services should extend NameServiceMapping interface to register
         * themselves.
         */
        getProvider(name) {
            if (this.providers.has(name)) {
                return this.providers.get(name);
            }
            // create a Provider for a service that hasn't registered with Firebase
            const provider = new Provider(name, this);
            this.providers.set(name, provider);
            return provider;
        }
        getProviders() {
            return Array.from(this.providers.values());
        }
    }

    /**
     * @license
     * Copyright 2017 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The JS SDK supports 5 log levels and also allows a user the ability to
     * silence the logs altogether.
     *
     * The order is a follows:
     * DEBUG < VERBOSE < INFO < WARN < ERROR
     *
     * All of the log types above the current log level will be captured (i.e. if
     * you set the log level to `INFO`, errors will still be logged, but `DEBUG` and
     * `VERBOSE` logs will not)
     */
    var LogLevel;
    (function (LogLevel) {
        LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
        LogLevel[LogLevel["VERBOSE"] = 1] = "VERBOSE";
        LogLevel[LogLevel["INFO"] = 2] = "INFO";
        LogLevel[LogLevel["WARN"] = 3] = "WARN";
        LogLevel[LogLevel["ERROR"] = 4] = "ERROR";
        LogLevel[LogLevel["SILENT"] = 5] = "SILENT";
    })(LogLevel || (LogLevel = {}));
    const levelStringToEnum = {
        'debug': LogLevel.DEBUG,
        'verbose': LogLevel.VERBOSE,
        'info': LogLevel.INFO,
        'warn': LogLevel.WARN,
        'error': LogLevel.ERROR,
        'silent': LogLevel.SILENT
    };
    /**
     * The default log level
     */
    const defaultLogLevel = LogLevel.INFO;
    /**
     * By default, `console.debug` is not displayed in the developer console (in
     * chrome). To avoid forcing users to have to opt-in to these logs twice
     * (i.e. once for firebase, and once in the console), we are sending `DEBUG`
     * logs to the `console.log` function.
     */
    const ConsoleMethod = {
        [LogLevel.DEBUG]: 'log',
        [LogLevel.VERBOSE]: 'log',
        [LogLevel.INFO]: 'info',
        [LogLevel.WARN]: 'warn',
        [LogLevel.ERROR]: 'error'
    };
    /**
     * The default log handler will forward DEBUG, VERBOSE, INFO, WARN, and ERROR
     * messages on to their corresponding console counterparts (if the log method
     * is supported by the current log level)
     */
    const defaultLogHandler = (instance, logType, ...args) => {
        if (logType < instance.logLevel) {
            return;
        }
        const now = new Date().toISOString();
        const method = ConsoleMethod[logType];
        if (method) {
            console[method](`[${now}]  ${instance.name}:`, ...args);
        }
        else {
            throw new Error(`Attempted to log a message with an invalid logType (value: ${logType})`);
        }
    };
    class Logger {
        /**
         * Gives you an instance of a Logger to capture messages according to
         * Firebase's logging scheme.
         *
         * @param name The name that the logs will be associated with
         */
        constructor(name) {
            this.name = name;
            /**
             * The log level of the given Logger instance.
             */
            this._logLevel = defaultLogLevel;
            /**
             * The main (internal) log handler for the Logger instance.
             * Can be set to a new function in internal package code but not by user.
             */
            this._logHandler = defaultLogHandler;
            /**
             * The optional, additional, user-defined log handler for the Logger instance.
             */
            this._userLogHandler = null;
        }
        get logLevel() {
            return this._logLevel;
        }
        set logLevel(val) {
            if (!(val in LogLevel)) {
                throw new TypeError(`Invalid value "${val}" assigned to \`logLevel\``);
            }
            this._logLevel = val;
        }
        // Workaround for setter/getter having to be the same type.
        setLogLevel(val) {
            this._logLevel = typeof val === 'string' ? levelStringToEnum[val] : val;
        }
        get logHandler() {
            return this._logHandler;
        }
        set logHandler(val) {
            if (typeof val !== 'function') {
                throw new TypeError('Value assigned to `logHandler` must be a function');
            }
            this._logHandler = val;
        }
        get userLogHandler() {
            return this._userLogHandler;
        }
        set userLogHandler(val) {
            this._userLogHandler = val;
        }
        /**
         * The functions below are all based on the `console` interface
         */
        debug(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.DEBUG, ...args);
            this._logHandler(this, LogLevel.DEBUG, ...args);
        }
        log(...args) {
            this._userLogHandler &&
                this._userLogHandler(this, LogLevel.VERBOSE, ...args);
            this._logHandler(this, LogLevel.VERBOSE, ...args);
        }
        info(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.INFO, ...args);
            this._logHandler(this, LogLevel.INFO, ...args);
        }
        warn(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.WARN, ...args);
            this._logHandler(this, LogLevel.WARN, ...args);
        }
        error(...args) {
            this._userLogHandler && this._userLogHandler(this, LogLevel.ERROR, ...args);
            this._logHandler(this, LogLevel.ERROR, ...args);
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class PlatformLoggerServiceImpl {
        constructor(container) {
            this.container = container;
        }
        // In initial implementation, this will be called by installations on
        // auth token refresh, and installations will send this string.
        getPlatformInfoString() {
            const providers = this.container.getProviders();
            // Loop through providers and get library/version pairs from any that are
            // version components.
            return providers
                .map(provider => {
                if (isVersionServiceProvider(provider)) {
                    const service = provider.getImmediate();
                    return `${service.library}/${service.version}`;
                }
                else {
                    return null;
                }
            })
                .filter(logString => logString)
                .join(' ');
        }
    }
    /**
     *
     * @param provider check if this provider provides a VersionService
     *
     * NOTE: Using Provider<'app-version'> is a hack to indicate that the provider
     * provides VersionService. The provider is not necessarily a 'app-version'
     * provider.
     */
    function isVersionServiceProvider(provider) {
        const component = provider.getComponent();
        return (component === null || component === void 0 ? void 0 : component.type) === "VERSION" /* VERSION */;
    }

    const name$o = "@firebase/app";
    const version$1$1 = "0.7.9";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const logger$1 = new Logger('@firebase/app');

    const name$n = "@firebase/app-compat";

    const name$m = "@firebase/analytics-compat";

    const name$l = "@firebase/analytics";

    const name$k = "@firebase/app-check-compat";

    const name$j = "@firebase/app-check";

    const name$i = "@firebase/auth";

    const name$h = "@firebase/auth-compat";

    const name$g = "@firebase/database";

    const name$f = "@firebase/database-compat";

    const name$e = "@firebase/functions";

    const name$d = "@firebase/functions-compat";

    const name$c = "@firebase/installations";

    const name$b = "@firebase/installations-compat";

    const name$a = "@firebase/messaging";

    const name$9 = "@firebase/messaging-compat";

    const name$8 = "@firebase/performance";

    const name$7 = "@firebase/performance-compat";

    const name$6 = "@firebase/remote-config";

    const name$5 = "@firebase/remote-config-compat";

    const name$4 = "@firebase/storage";

    const name$3 = "@firebase/storage-compat";

    const name$2$1 = "@firebase/firestore";

    const name$1$1 = "@firebase/firestore-compat";

    const name$p = "firebase";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * The default app name
     *
     * @internal
     */
    const DEFAULT_ENTRY_NAME = '[DEFAULT]';
    const PLATFORM_LOG_STRING = {
        [name$o]: 'fire-core',
        [name$n]: 'fire-core-compat',
        [name$l]: 'fire-analytics',
        [name$m]: 'fire-analytics-compat',
        [name$j]: 'fire-app-check',
        [name$k]: 'fire-app-check-compat',
        [name$i]: 'fire-auth',
        [name$h]: 'fire-auth-compat',
        [name$g]: 'fire-rtdb',
        [name$f]: 'fire-rtdb-compat',
        [name$e]: 'fire-fn',
        [name$d]: 'fire-fn-compat',
        [name$c]: 'fire-iid',
        [name$b]: 'fire-iid-compat',
        [name$a]: 'fire-fcm',
        [name$9]: 'fire-fcm-compat',
        [name$8]: 'fire-perf',
        [name$7]: 'fire-perf-compat',
        [name$6]: 'fire-rc',
        [name$5]: 'fire-rc-compat',
        [name$4]: 'fire-gcs',
        [name$3]: 'fire-gcs-compat',
        [name$2$1]: 'fire-fst',
        [name$1$1]: 'fire-fst-compat',
        'fire-js': 'fire-js',
        [name$p]: 'fire-js-all'
    };

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * @internal
     */
    const _apps = new Map();
    /**
     * Registered components.
     *
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const _components = new Map();
    /**
     * @param component - the component being added to this app's container
     *
     * @internal
     */
    function _addComponent(app, component) {
        try {
            app.container.addComponent(component);
        }
        catch (e) {
            logger$1.debug(`Component ${component.name} failed to register with FirebaseApp ${app.name}`, e);
        }
    }
    /**
     *
     * @param component - the component to register
     * @returns whether or not the component is registered successfully
     *
     * @internal
     */
    function _registerComponent(component) {
        const componentName = component.name;
        if (_components.has(componentName)) {
            logger$1.debug(`There were multiple attempts to register component ${componentName}.`);
            return false;
        }
        _components.set(componentName, component);
        // add the component to existing app instances
        for (const app of _apps.values()) {
            _addComponent(app, component);
        }
        return true;
    }
    /**
     *
     * @param app - FirebaseApp instance
     * @param name - service name
     *
     * @returns the provider for the service with the matching name
     *
     * @internal
     */
    function _getProvider(app, name) {
        return app.container.getProvider(name);
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const ERRORS$1 = {
        ["no-app" /* NO_APP */]: "No Firebase App '{$appName}' has been created - " +
            'call Firebase App.initializeApp()',
        ["bad-app-name" /* BAD_APP_NAME */]: "Illegal App name: '{$appName}",
        ["duplicate-app" /* DUPLICATE_APP */]: "Firebase App named '{$appName}' already exists with different options or config",
        ["app-deleted" /* APP_DELETED */]: "Firebase App named '{$appName}' already deleted",
        ["invalid-app-argument" /* INVALID_APP_ARGUMENT */]: 'firebase.{$appName}() takes either no argument or a ' +
            'Firebase App instance.',
        ["invalid-log-argument" /* INVALID_LOG_ARGUMENT */]: 'First argument to `onLog` must be null or a function.'
    };
    const ERROR_FACTORY$2 = new ErrorFactory('app', 'Firebase', ERRORS$1);

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    class FirebaseAppImpl {
        constructor(options, config, container) {
            this._isDeleted = false;
            this._options = Object.assign({}, options);
            this._config = Object.assign({}, config);
            this._name = config.name;
            this._automaticDataCollectionEnabled =
                config.automaticDataCollectionEnabled;
            this._container = container;
            this.container.addComponent(new Component('app', () => this, "PUBLIC" /* PUBLIC */));
        }
        get automaticDataCollectionEnabled() {
            this.checkDestroyed();
            return this._automaticDataCollectionEnabled;
        }
        set automaticDataCollectionEnabled(val) {
            this.checkDestroyed();
            this._automaticDataCollectionEnabled = val;
        }
        get name() {
            this.checkDestroyed();
            return this._name;
        }
        get options() {
            this.checkDestroyed();
            return this._options;
        }
        get config() {
            this.checkDestroyed();
            return this._config;
        }
        get container() {
            return this._container;
        }
        get isDeleted() {
            return this._isDeleted;
        }
        set isDeleted(val) {
            this._isDeleted = val;
        }
        /**
         * This function will throw an Error if the App has already been deleted -
         * use before performing API actions on the App.
         */
        checkDestroyed() {
            if (this.isDeleted) {
                throw ERROR_FACTORY$2.create("app-deleted" /* APP_DELETED */, { appName: this._name });
            }
        }
    }
    function initializeApp(options, rawConfig = {}) {
        if (typeof rawConfig !== 'object') {
            const name = rawConfig;
            rawConfig = { name };
        }
        const config = Object.assign({ name: DEFAULT_ENTRY_NAME, automaticDataCollectionEnabled: false }, rawConfig);
        const name = config.name;
        if (typeof name !== 'string' || !name) {
            throw ERROR_FACTORY$2.create("bad-app-name" /* BAD_APP_NAME */, {
                appName: String(name)
            });
        }
        const existingApp = _apps.get(name);
        if (existingApp) {
            // return the existing app if options and config deep equal the ones in the existing app.
            if (deepEqual(options, existingApp.options) &&
                deepEqual(config, existingApp.config)) {
                return existingApp;
            }
            else {
                throw ERROR_FACTORY$2.create("duplicate-app" /* DUPLICATE_APP */, { appName: name });
            }
        }
        const container = new ComponentContainer(name);
        for (const component of _components.values()) {
            container.addComponent(component);
        }
        const newApp = new FirebaseAppImpl(options, config, container);
        _apps.set(name, newApp);
        return newApp;
    }
    /**
     * Retrieves a {@link @firebase/app#FirebaseApp} instance.
     *
     * When called with no arguments, the default app is returned. When an app name
     * is provided, the app corresponding to that name is returned.
     *
     * An exception is thrown if the app being retrieved has not yet been
     * initialized.
     *
     * @example
     * ```javascript
     * // Return the default app
     * const app = getApp();
     * ```
     *
     * @example
     * ```javascript
     * // Return a named app
     * const otherApp = getApp("otherApp");
     * ```
     *
     * @param name - Optional name of the app to return. If no name is
     *   provided, the default is `"[DEFAULT]"`.
     *
     * @returns The app corresponding to the provided app name.
     *   If no app name is provided, the default app is returned.
     *
     * @public
     */
    function getApp(name = DEFAULT_ENTRY_NAME) {
        const app = _apps.get(name);
        if (!app) {
            throw ERROR_FACTORY$2.create("no-app" /* NO_APP */, { appName: name });
        }
        return app;
    }
    /**
     * Registers a library's name and version for platform logging purposes.
     * @param library - Name of 1p or 3p library (e.g. firestore, angularfire)
     * @param version - Current version of that library.
     * @param variant - Bundle variant, e.g., node, rn, etc.
     *
     * @public
     */
    function registerVersion(libraryKeyOrName, version, variant) {
        var _a;
        // TODO: We can use this check to whitelist strings when/if we set up
        // a good whitelist system.
        let library = (_a = PLATFORM_LOG_STRING[libraryKeyOrName]) !== null && _a !== void 0 ? _a : libraryKeyOrName;
        if (variant) {
            library += `-${variant}`;
        }
        const libraryMismatch = library.match(/\s|\//);
        const versionMismatch = version.match(/\s|\//);
        if (libraryMismatch || versionMismatch) {
            const warning = [
                `Unable to register library "${library}" with version "${version}":`
            ];
            if (libraryMismatch) {
                warning.push(`library name "${library}" contains illegal characters (whitespace or "/")`);
            }
            if (libraryMismatch && versionMismatch) {
                warning.push('and');
            }
            if (versionMismatch) {
                warning.push(`version name "${version}" contains illegal characters (whitespace or "/")`);
            }
            logger$1.warn(warning.join(' '));
            return;
        }
        _registerComponent(new Component(`${library}-version`, () => ({ library, version }), "VERSION" /* VERSION */));
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function registerCoreComponents(variant) {
        _registerComponent(new Component('platform-logger', container => new PlatformLoggerServiceImpl(container), "PRIVATE" /* PRIVATE */));
        // Register `app` package.
        registerVersion(name$o, version$1$1, variant);
        // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
        registerVersion(name$o, version$1$1, 'esm2017');
        // Register platform SDK identifier (no version).
        registerVersion('fire-js', '');
    }

    /**
     * Firebase App
     *
     * @remarks This package coordinates the communication between the different Firebase components
     * @packageDocumentation
     */
    registerCoreComponents('');

    var name$2 = "firebase";
    var version$3 = "9.5.0";

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    registerVersion(name$2, version$3, 'app');

    function toArray(arr) {
      return Array.prototype.slice.call(arr);
    }

    function promisifyRequest(request) {
      return new Promise(function(resolve, reject) {
        request.onsuccess = function() {
          resolve(request.result);
        };

        request.onerror = function() {
          reject(request.error);
        };
      });
    }

    function promisifyRequestCall(obj, method, args) {
      var request;
      var p = new Promise(function(resolve, reject) {
        request = obj[method].apply(obj, args);
        promisifyRequest(request).then(resolve, reject);
      });

      p.request = request;
      return p;
    }

    function promisifyCursorRequestCall(obj, method, args) {
      var p = promisifyRequestCall(obj, method, args);
      return p.then(function(value) {
        if (!value) return;
        return new Cursor(value, p.request);
      });
    }

    function proxyProperties(ProxyClass, targetProp, properties) {
      properties.forEach(function(prop) {
        Object.defineProperty(ProxyClass.prototype, prop, {
          get: function() {
            return this[targetProp][prop];
          },
          set: function(val) {
            this[targetProp][prop] = val;
          }
        });
      });
    }

    function proxyRequestMethods(ProxyClass, targetProp, Constructor, properties) {
      properties.forEach(function(prop) {
        if (!(prop in Constructor.prototype)) return;
        ProxyClass.prototype[prop] = function() {
          return promisifyRequestCall(this[targetProp], prop, arguments);
        };
      });
    }

    function proxyMethods(ProxyClass, targetProp, Constructor, properties) {
      properties.forEach(function(prop) {
        if (!(prop in Constructor.prototype)) return;
        ProxyClass.prototype[prop] = function() {
          return this[targetProp][prop].apply(this[targetProp], arguments);
        };
      });
    }

    function proxyCursorRequestMethods(ProxyClass, targetProp, Constructor, properties) {
      properties.forEach(function(prop) {
        if (!(prop in Constructor.prototype)) return;
        ProxyClass.prototype[prop] = function() {
          return promisifyCursorRequestCall(this[targetProp], prop, arguments);
        };
      });
    }

    function Index(index) {
      this._index = index;
    }

    proxyProperties(Index, '_index', [
      'name',
      'keyPath',
      'multiEntry',
      'unique'
    ]);

    proxyRequestMethods(Index, '_index', IDBIndex, [
      'get',
      'getKey',
      'getAll',
      'getAllKeys',
      'count'
    ]);

    proxyCursorRequestMethods(Index, '_index', IDBIndex, [
      'openCursor',
      'openKeyCursor'
    ]);

    function Cursor(cursor, request) {
      this._cursor = cursor;
      this._request = request;
    }

    proxyProperties(Cursor, '_cursor', [
      'direction',
      'key',
      'primaryKey',
      'value'
    ]);

    proxyRequestMethods(Cursor, '_cursor', IDBCursor, [
      'update',
      'delete'
    ]);

    // proxy 'next' methods
    ['advance', 'continue', 'continuePrimaryKey'].forEach(function(methodName) {
      if (!(methodName in IDBCursor.prototype)) return;
      Cursor.prototype[methodName] = function() {
        var cursor = this;
        var args = arguments;
        return Promise.resolve().then(function() {
          cursor._cursor[methodName].apply(cursor._cursor, args);
          return promisifyRequest(cursor._request).then(function(value) {
            if (!value) return;
            return new Cursor(value, cursor._request);
          });
        });
      };
    });

    function ObjectStore(store) {
      this._store = store;
    }

    ObjectStore.prototype.createIndex = function() {
      return new Index(this._store.createIndex.apply(this._store, arguments));
    };

    ObjectStore.prototype.index = function() {
      return new Index(this._store.index.apply(this._store, arguments));
    };

    proxyProperties(ObjectStore, '_store', [
      'name',
      'keyPath',
      'indexNames',
      'autoIncrement'
    ]);

    proxyRequestMethods(ObjectStore, '_store', IDBObjectStore, [
      'put',
      'add',
      'delete',
      'clear',
      'get',
      'getAll',
      'getKey',
      'getAllKeys',
      'count'
    ]);

    proxyCursorRequestMethods(ObjectStore, '_store', IDBObjectStore, [
      'openCursor',
      'openKeyCursor'
    ]);

    proxyMethods(ObjectStore, '_store', IDBObjectStore, [
      'deleteIndex'
    ]);

    function Transaction(idbTransaction) {
      this._tx = idbTransaction;
      this.complete = new Promise(function(resolve, reject) {
        idbTransaction.oncomplete = function() {
          resolve();
        };
        idbTransaction.onerror = function() {
          reject(idbTransaction.error);
        };
        idbTransaction.onabort = function() {
          reject(idbTransaction.error);
        };
      });
    }

    Transaction.prototype.objectStore = function() {
      return new ObjectStore(this._tx.objectStore.apply(this._tx, arguments));
    };

    proxyProperties(Transaction, '_tx', [
      'objectStoreNames',
      'mode'
    ]);

    proxyMethods(Transaction, '_tx', IDBTransaction, [
      'abort'
    ]);

    function UpgradeDB(db, oldVersion, transaction) {
      this._db = db;
      this.oldVersion = oldVersion;
      this.transaction = new Transaction(transaction);
    }

    UpgradeDB.prototype.createObjectStore = function() {
      return new ObjectStore(this._db.createObjectStore.apply(this._db, arguments));
    };

    proxyProperties(UpgradeDB, '_db', [
      'name',
      'version',
      'objectStoreNames'
    ]);

    proxyMethods(UpgradeDB, '_db', IDBDatabase, [
      'deleteObjectStore',
      'close'
    ]);

    function DB(db) {
      this._db = db;
    }

    DB.prototype.transaction = function() {
      return new Transaction(this._db.transaction.apply(this._db, arguments));
    };

    proxyProperties(DB, '_db', [
      'name',
      'version',
      'objectStoreNames'
    ]);

    proxyMethods(DB, '_db', IDBDatabase, [
      'close'
    ]);

    // Add cursor iterators
    // TODO: remove this once browsers do the right thing with promises
    ['openCursor', 'openKeyCursor'].forEach(function(funcName) {
      [ObjectStore, Index].forEach(function(Constructor) {
        // Don't create iterateKeyCursor if openKeyCursor doesn't exist.
        if (!(funcName in Constructor.prototype)) return;

        Constructor.prototype[funcName.replace('open', 'iterate')] = function() {
          var args = toArray(arguments);
          var callback = args[args.length - 1];
          var nativeObject = this._store || this._index;
          var request = nativeObject[funcName].apply(nativeObject, args.slice(0, -1));
          request.onsuccess = function() {
            callback(request.result);
          };
        };
      });
    });

    // polyfill getAll
    [Index, ObjectStore].forEach(function(Constructor) {
      if (Constructor.prototype.getAll) return;
      Constructor.prototype.getAll = function(query, count) {
        var instance = this;
        var items = [];

        return new Promise(function(resolve) {
          instance.iterateCursor(query, function(cursor) {
            if (!cursor) {
              resolve(items);
              return;
            }
            items.push(cursor.value);

            if (count !== undefined && items.length == count) {
              resolve(items);
              return;
            }
            cursor.continue();
          });
        });
      };
    });

    function openDb(name, version, upgradeCallback) {
      var p = promisifyRequestCall(indexedDB, 'open', [name, version]);
      var request = p.request;

      if (request) {
        request.onupgradeneeded = function(event) {
          if (upgradeCallback) {
            upgradeCallback(new UpgradeDB(request.result, event.oldVersion, request.transaction));
          }
        };
      }

      return p.then(function(db) {
        return new DB(db);
      });
    }

    const name$1 = "@firebase/installations";
    const version$2 = "0.5.4";

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const PENDING_TIMEOUT_MS = 10000;
    const PACKAGE_VERSION = `w:${version$2}`;
    const INTERNAL_AUTH_VERSION = 'FIS_v2';
    const INSTALLATIONS_API_URL = 'https://firebaseinstallations.googleapis.com/v1';
    const TOKEN_EXPIRATION_BUFFER = 60 * 60 * 1000; // One hour
    const SERVICE = 'installations';
    const SERVICE_NAME = 'Installations';

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const ERROR_DESCRIPTION_MAP = {
        ["missing-app-config-values" /* MISSING_APP_CONFIG_VALUES */]: 'Missing App configuration value: "{$valueName}"',
        ["not-registered" /* NOT_REGISTERED */]: 'Firebase Installation is not registered.',
        ["installation-not-found" /* INSTALLATION_NOT_FOUND */]: 'Firebase Installation not found.',
        ["request-failed" /* REQUEST_FAILED */]: '{$requestName} request failed with error "{$serverCode} {$serverStatus}: {$serverMessage}"',
        ["app-offline" /* APP_OFFLINE */]: 'Could not process request. Application offline.',
        ["delete-pending-registration" /* DELETE_PENDING_REGISTRATION */]: "Can't delete installation while there is a pending registration request."
    };
    const ERROR_FACTORY$1 = new ErrorFactory(SERVICE, SERVICE_NAME, ERROR_DESCRIPTION_MAP);
    /** Returns true if error is a FirebaseError that is based on an error from the server. */
    function isServerError(error) {
        return (error instanceof FirebaseError &&
            error.code.includes("request-failed" /* REQUEST_FAILED */));
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function getInstallationsEndpoint({ projectId }) {
        return `${INSTALLATIONS_API_URL}/projects/${projectId}/installations`;
    }
    function extractAuthTokenInfoFromResponse(response) {
        return {
            token: response.token,
            requestStatus: 2 /* COMPLETED */,
            expiresIn: getExpiresInFromResponseExpiresIn(response.expiresIn),
            creationTime: Date.now()
        };
    }
    async function getErrorFromResponse(requestName, response) {
        const responseJson = await response.json();
        const errorData = responseJson.error;
        return ERROR_FACTORY$1.create("request-failed" /* REQUEST_FAILED */, {
            requestName,
            serverCode: errorData.code,
            serverMessage: errorData.message,
            serverStatus: errorData.status
        });
    }
    function getHeaders$1({ apiKey }) {
        return new Headers({
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'x-goog-api-key': apiKey
        });
    }
    function getHeadersWithAuth(appConfig, { refreshToken }) {
        const headers = getHeaders$1(appConfig);
        headers.append('Authorization', getAuthorizationHeader(refreshToken));
        return headers;
    }
    /**
     * Calls the passed in fetch wrapper and returns the response.
     * If the returned response has a status of 5xx, re-runs the function once and
     * returns the response.
     */
    async function retryIfServerError(fn) {
        const result = await fn();
        if (result.status >= 500 && result.status < 600) {
            // Internal Server Error. Retry request.
            return fn();
        }
        return result;
    }
    function getExpiresInFromResponseExpiresIn(responseExpiresIn) {
        // This works because the server will never respond with fractions of a second.
        return Number(responseExpiresIn.replace('s', '000'));
    }
    function getAuthorizationHeader(refreshToken) {
        return `${INTERNAL_AUTH_VERSION} ${refreshToken}`;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    async function createInstallationRequest(appConfig, { fid }) {
        const endpoint = getInstallationsEndpoint(appConfig);
        const headers = getHeaders$1(appConfig);
        const body = {
            fid,
            authVersion: INTERNAL_AUTH_VERSION,
            appId: appConfig.appId,
            sdkVersion: PACKAGE_VERSION
        };
        const request = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };
        const response = await retryIfServerError(() => fetch(endpoint, request));
        if (response.ok) {
            const responseValue = await response.json();
            const registeredInstallationEntry = {
                fid: responseValue.fid || fid,
                registrationStatus: 2 /* COMPLETED */,
                refreshToken: responseValue.refreshToken,
                authToken: extractAuthTokenInfoFromResponse(responseValue.authToken)
            };
            return registeredInstallationEntry;
        }
        else {
            throw await getErrorFromResponse('Create Installation', response);
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /** Returns a promise that resolves after given time passes. */
    function sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function bufferToBase64UrlSafe(array) {
        const b64 = btoa(String.fromCharCode(...array));
        return b64.replace(/\+/g, '-').replace(/\//g, '_');
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const VALID_FID_PATTERN = /^[cdef][\w-]{21}$/;
    const INVALID_FID = '';
    /**
     * Generates a new FID using random values from Web Crypto API.
     * Returns an empty string if FID generation fails for any reason.
     */
    function generateFid() {
        try {
            // A valid FID has exactly 22 base64 characters, which is 132 bits, or 16.5
            // bytes. our implementation generates a 17 byte array instead.
            const fidByteArray = new Uint8Array(17);
            const crypto = self.crypto || self.msCrypto;
            crypto.getRandomValues(fidByteArray);
            // Replace the first 4 random bits with the constant FID header of 0b0111.
            fidByteArray[0] = 0b01110000 + (fidByteArray[0] % 0b00010000);
            const fid = encode(fidByteArray);
            return VALID_FID_PATTERN.test(fid) ? fid : INVALID_FID;
        }
        catch (_a) {
            // FID generation errored
            return INVALID_FID;
        }
    }
    /** Converts a FID Uint8Array to a base64 string representation. */
    function encode(fidByteArray) {
        const b64String = bufferToBase64UrlSafe(fidByteArray);
        // Remove the 23rd character that was added because of the extra 4 bits at the
        // end of our 17 byte array, and the '=' padding.
        return b64String.substr(0, 22);
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /** Returns a string key that can be used to identify the app. */
    function getKey(appConfig) {
        return `${appConfig.appName}!${appConfig.appId}`;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const fidChangeCallbacks = new Map();
    /**
     * Calls the onIdChange callbacks with the new FID value, and broadcasts the
     * change to other tabs.
     */
    function fidChanged(appConfig, fid) {
        const key = getKey(appConfig);
        callFidChangeCallbacks(key, fid);
        broadcastFidChange(key, fid);
    }
    function callFidChangeCallbacks(key, fid) {
        const callbacks = fidChangeCallbacks.get(key);
        if (!callbacks) {
            return;
        }
        for (const callback of callbacks) {
            callback(fid);
        }
    }
    function broadcastFidChange(key, fid) {
        const channel = getBroadcastChannel();
        if (channel) {
            channel.postMessage({ key, fid });
        }
        closeBroadcastChannel();
    }
    let broadcastChannel = null;
    /** Opens and returns a BroadcastChannel if it is supported by the browser. */
    function getBroadcastChannel() {
        if (!broadcastChannel && 'BroadcastChannel' in self) {
            broadcastChannel = new BroadcastChannel('[Firebase] FID Change');
            broadcastChannel.onmessage = e => {
                callFidChangeCallbacks(e.data.key, e.data.fid);
            };
        }
        return broadcastChannel;
    }
    function closeBroadcastChannel() {
        if (fidChangeCallbacks.size === 0 && broadcastChannel) {
            broadcastChannel.close();
            broadcastChannel = null;
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const DATABASE_NAME = 'firebase-installations-database';
    const DATABASE_VERSION = 1;
    const OBJECT_STORE_NAME = 'firebase-installations-store';
    let dbPromise = null;
    function getDbPromise() {
        if (!dbPromise) {
            dbPromise = openDb(DATABASE_NAME, DATABASE_VERSION, upgradeDB => {
                // We don't use 'break' in this switch statement, the fall-through
                // behavior is what we want, because if there are multiple versions between
                // the old version and the current version, we want ALL the migrations
                // that correspond to those versions to run, not only the last one.
                // eslint-disable-next-line default-case
                switch (upgradeDB.oldVersion) {
                    case 0:
                        upgradeDB.createObjectStore(OBJECT_STORE_NAME);
                }
            });
        }
        return dbPromise;
    }
    /** Assigns or overwrites the record for the given key with the given value. */
    async function set$1(appConfig, value) {
        const key = getKey(appConfig);
        const db = await getDbPromise();
        const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
        const objectStore = tx.objectStore(OBJECT_STORE_NAME);
        const oldValue = await objectStore.get(key);
        await objectStore.put(value, key);
        await tx.complete;
        if (!oldValue || oldValue.fid !== value.fid) {
            fidChanged(appConfig, value.fid);
        }
        return value;
    }
    /** Removes record(s) from the objectStore that match the given key. */
    async function remove(appConfig) {
        const key = getKey(appConfig);
        const db = await getDbPromise();
        const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
        await tx.objectStore(OBJECT_STORE_NAME).delete(key);
        await tx.complete;
    }
    /**
     * Atomically updates a record with the result of updateFn, which gets
     * called with the current value. If newValue is undefined, the record is
     * deleted instead.
     * @return Updated value
     */
    async function update(appConfig, updateFn) {
        const key = getKey(appConfig);
        const db = await getDbPromise();
        const tx = db.transaction(OBJECT_STORE_NAME, 'readwrite');
        const store = tx.objectStore(OBJECT_STORE_NAME);
        const oldValue = await store.get(key);
        const newValue = updateFn(oldValue);
        if (newValue === undefined) {
            await store.delete(key);
        }
        else {
            await store.put(newValue, key);
        }
        await tx.complete;
        if (newValue && (!oldValue || oldValue.fid !== newValue.fid)) {
            fidChanged(appConfig, newValue.fid);
        }
        return newValue;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Updates and returns the InstallationEntry from the database.
     * Also triggers a registration request if it is necessary and possible.
     */
    async function getInstallationEntry(appConfig) {
        let registrationPromise;
        const installationEntry = await update(appConfig, oldEntry => {
            const installationEntry = updateOrCreateInstallationEntry(oldEntry);
            const entryWithPromise = triggerRegistrationIfNecessary(appConfig, installationEntry);
            registrationPromise = entryWithPromise.registrationPromise;
            return entryWithPromise.installationEntry;
        });
        if (installationEntry.fid === INVALID_FID) {
            // FID generation failed. Waiting for the FID from the server.
            return { installationEntry: await registrationPromise };
        }
        return {
            installationEntry,
            registrationPromise
        };
    }
    /**
     * Creates a new Installation Entry if one does not exist.
     * Also clears timed out pending requests.
     */
    function updateOrCreateInstallationEntry(oldEntry) {
        const entry = oldEntry || {
            fid: generateFid(),
            registrationStatus: 0 /* NOT_STARTED */
        };
        return clearTimedOutRequest(entry);
    }
    /**
     * If the Firebase Installation is not registered yet, this will trigger the
     * registration and return an InProgressInstallationEntry.
     *
     * If registrationPromise does not exist, the installationEntry is guaranteed
     * to be registered.
     */
    function triggerRegistrationIfNecessary(appConfig, installationEntry) {
        if (installationEntry.registrationStatus === 0 /* NOT_STARTED */) {
            if (!navigator.onLine) {
                // Registration required but app is offline.
                const registrationPromiseWithError = Promise.reject(ERROR_FACTORY$1.create("app-offline" /* APP_OFFLINE */));
                return {
                    installationEntry,
                    registrationPromise: registrationPromiseWithError
                };
            }
            // Try registering. Change status to IN_PROGRESS.
            const inProgressEntry = {
                fid: installationEntry.fid,
                registrationStatus: 1 /* IN_PROGRESS */,
                registrationTime: Date.now()
            };
            const registrationPromise = registerInstallation(appConfig, inProgressEntry);
            return { installationEntry: inProgressEntry, registrationPromise };
        }
        else if (installationEntry.registrationStatus === 1 /* IN_PROGRESS */) {
            return {
                installationEntry,
                registrationPromise: waitUntilFidRegistration(appConfig)
            };
        }
        else {
            return { installationEntry };
        }
    }
    /** This will be executed only once for each new Firebase Installation. */
    async function registerInstallation(appConfig, installationEntry) {
        try {
            const registeredInstallationEntry = await createInstallationRequest(appConfig, installationEntry);
            return set$1(appConfig, registeredInstallationEntry);
        }
        catch (e) {
            if (isServerError(e) && e.customData.serverCode === 409) {
                // Server returned a "FID can not be used" error.
                // Generate a new ID next time.
                await remove(appConfig);
            }
            else {
                // Registration failed. Set FID as not registered.
                await set$1(appConfig, {
                    fid: installationEntry.fid,
                    registrationStatus: 0 /* NOT_STARTED */
                });
            }
            throw e;
        }
    }
    /** Call if FID registration is pending in another request. */
    async function waitUntilFidRegistration(appConfig) {
        // Unfortunately, there is no way of reliably observing when a value in
        // IndexedDB changes (yet, see https://github.com/WICG/indexed-db-observers),
        // so we need to poll.
        let entry = await updateInstallationRequest(appConfig);
        while (entry.registrationStatus === 1 /* IN_PROGRESS */) {
            // createInstallation request still in progress.
            await sleep(100);
            entry = await updateInstallationRequest(appConfig);
        }
        if (entry.registrationStatus === 0 /* NOT_STARTED */) {
            // The request timed out or failed in a different call. Try again.
            const { installationEntry, registrationPromise } = await getInstallationEntry(appConfig);
            if (registrationPromise) {
                return registrationPromise;
            }
            else {
                // if there is no registrationPromise, entry is registered.
                return installationEntry;
            }
        }
        return entry;
    }
    /**
     * Called only if there is a CreateInstallation request in progress.
     *
     * Updates the InstallationEntry in the DB based on the status of the
     * CreateInstallation request.
     *
     * Returns the updated InstallationEntry.
     */
    function updateInstallationRequest(appConfig) {
        return update(appConfig, oldEntry => {
            if (!oldEntry) {
                throw ERROR_FACTORY$1.create("installation-not-found" /* INSTALLATION_NOT_FOUND */);
            }
            return clearTimedOutRequest(oldEntry);
        });
    }
    function clearTimedOutRequest(entry) {
        if (hasInstallationRequestTimedOut(entry)) {
            return {
                fid: entry.fid,
                registrationStatus: 0 /* NOT_STARTED */
            };
        }
        return entry;
    }
    function hasInstallationRequestTimedOut(installationEntry) {
        return (installationEntry.registrationStatus === 1 /* IN_PROGRESS */ &&
            installationEntry.registrationTime + PENDING_TIMEOUT_MS < Date.now());
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    async function generateAuthTokenRequest({ appConfig, platformLoggerProvider }, installationEntry) {
        const endpoint = getGenerateAuthTokenEndpoint(appConfig, installationEntry);
        const headers = getHeadersWithAuth(appConfig, installationEntry);
        // If platform logger exists, add the platform info string to the header.
        const platformLogger = platformLoggerProvider.getImmediate({
            optional: true
        });
        if (platformLogger) {
            headers.append('x-firebase-client', platformLogger.getPlatformInfoString());
        }
        const body = {
            installation: {
                sdkVersion: PACKAGE_VERSION
            }
        };
        const request = {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        };
        const response = await retryIfServerError(() => fetch(endpoint, request));
        if (response.ok) {
            const responseValue = await response.json();
            const completedAuthToken = extractAuthTokenInfoFromResponse(responseValue);
            return completedAuthToken;
        }
        else {
            throw await getErrorFromResponse('Generate Auth Token', response);
        }
    }
    function getGenerateAuthTokenEndpoint(appConfig, { fid }) {
        return `${getInstallationsEndpoint(appConfig)}/${fid}/authTokens:generate`;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Returns a valid authentication token for the installation. Generates a new
     * token if one doesn't exist, is expired or about to expire.
     *
     * Should only be called if the Firebase Installation is registered.
     */
    async function refreshAuthToken(installations, forceRefresh = false) {
        let tokenPromise;
        const entry = await update(installations.appConfig, oldEntry => {
            if (!isEntryRegistered(oldEntry)) {
                throw ERROR_FACTORY$1.create("not-registered" /* NOT_REGISTERED */);
            }
            const oldAuthToken = oldEntry.authToken;
            if (!forceRefresh && isAuthTokenValid(oldAuthToken)) {
                // There is a valid token in the DB.
                return oldEntry;
            }
            else if (oldAuthToken.requestStatus === 1 /* IN_PROGRESS */) {
                // There already is a token request in progress.
                tokenPromise = waitUntilAuthTokenRequest(installations, forceRefresh);
                return oldEntry;
            }
            else {
                // No token or token expired.
                if (!navigator.onLine) {
                    throw ERROR_FACTORY$1.create("app-offline" /* APP_OFFLINE */);
                }
                const inProgressEntry = makeAuthTokenRequestInProgressEntry(oldEntry);
                tokenPromise = fetchAuthTokenFromServer(installations, inProgressEntry);
                return inProgressEntry;
            }
        });
        const authToken = tokenPromise
            ? await tokenPromise
            : entry.authToken;
        return authToken;
    }
    /**
     * Call only if FID is registered and Auth Token request is in progress.
     *
     * Waits until the current pending request finishes. If the request times out,
     * tries once in this thread as well.
     */
    async function waitUntilAuthTokenRequest(installations, forceRefresh) {
        // Unfortunately, there is no way of reliably observing when a value in
        // IndexedDB changes (yet, see https://github.com/WICG/indexed-db-observers),
        // so we need to poll.
        let entry = await updateAuthTokenRequest(installations.appConfig);
        while (entry.authToken.requestStatus === 1 /* IN_PROGRESS */) {
            // generateAuthToken still in progress.
            await sleep(100);
            entry = await updateAuthTokenRequest(installations.appConfig);
        }
        const authToken = entry.authToken;
        if (authToken.requestStatus === 0 /* NOT_STARTED */) {
            // The request timed out or failed in a different call. Try again.
            return refreshAuthToken(installations, forceRefresh);
        }
        else {
            return authToken;
        }
    }
    /**
     * Called only if there is a GenerateAuthToken request in progress.
     *
     * Updates the InstallationEntry in the DB based on the status of the
     * GenerateAuthToken request.
     *
     * Returns the updated InstallationEntry.
     */
    function updateAuthTokenRequest(appConfig) {
        return update(appConfig, oldEntry => {
            if (!isEntryRegistered(oldEntry)) {
                throw ERROR_FACTORY$1.create("not-registered" /* NOT_REGISTERED */);
            }
            const oldAuthToken = oldEntry.authToken;
            if (hasAuthTokenRequestTimedOut(oldAuthToken)) {
                return Object.assign(Object.assign({}, oldEntry), { authToken: { requestStatus: 0 /* NOT_STARTED */ } });
            }
            return oldEntry;
        });
    }
    async function fetchAuthTokenFromServer(installations, installationEntry) {
        try {
            const authToken = await generateAuthTokenRequest(installations, installationEntry);
            const updatedInstallationEntry = Object.assign(Object.assign({}, installationEntry), { authToken });
            await set$1(installations.appConfig, updatedInstallationEntry);
            return authToken;
        }
        catch (e) {
            if (isServerError(e) &&
                (e.customData.serverCode === 401 || e.customData.serverCode === 404)) {
                // Server returned a "FID not found" or a "Invalid authentication" error.
                // Generate a new ID next time.
                await remove(installations.appConfig);
            }
            else {
                const updatedInstallationEntry = Object.assign(Object.assign({}, installationEntry), { authToken: { requestStatus: 0 /* NOT_STARTED */ } });
                await set$1(installations.appConfig, updatedInstallationEntry);
            }
            throw e;
        }
    }
    function isEntryRegistered(installationEntry) {
        return (installationEntry !== undefined &&
            installationEntry.registrationStatus === 2 /* COMPLETED */);
    }
    function isAuthTokenValid(authToken) {
        return (authToken.requestStatus === 2 /* COMPLETED */ &&
            !isAuthTokenExpired(authToken));
    }
    function isAuthTokenExpired(authToken) {
        const now = Date.now();
        return (now < authToken.creationTime ||
            authToken.creationTime + authToken.expiresIn < now + TOKEN_EXPIRATION_BUFFER);
    }
    /** Returns an updated InstallationEntry with an InProgressAuthToken. */
    function makeAuthTokenRequestInProgressEntry(oldEntry) {
        const inProgressAuthToken = {
            requestStatus: 1 /* IN_PROGRESS */,
            requestTime: Date.now()
        };
        return Object.assign(Object.assign({}, oldEntry), { authToken: inProgressAuthToken });
    }
    function hasAuthTokenRequestTimedOut(authToken) {
        return (authToken.requestStatus === 1 /* IN_PROGRESS */ &&
            authToken.requestTime + PENDING_TIMEOUT_MS < Date.now());
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Creates a Firebase Installation if there isn't one for the app and
     * returns the Installation ID.
     * @param installations - The `Installations` instance.
     *
     * @public
     */
    async function getId(installations) {
        const installationsImpl = installations;
        const { installationEntry, registrationPromise } = await getInstallationEntry(installationsImpl.appConfig);
        if (registrationPromise) {
            registrationPromise.catch(console.error);
        }
        else {
            // If the installation is already registered, update the authentication
            // token if needed.
            refreshAuthToken(installationsImpl).catch(console.error);
        }
        return installationEntry.fid;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Returns a Firebase Installations auth token, identifying the current
     * Firebase Installation.
     * @param installations - The `Installations` instance.
     * @param forceRefresh - Force refresh regardless of token expiration.
     *
     * @public
     */
    async function getToken(installations, forceRefresh = false) {
        const installationsImpl = installations;
        await completeInstallationRegistration(installationsImpl.appConfig);
        // At this point we either have a Registered Installation in the DB, or we've
        // already thrown an error.
        const authToken = await refreshAuthToken(installationsImpl, forceRefresh);
        return authToken.token;
    }
    async function completeInstallationRegistration(appConfig) {
        const { registrationPromise } = await getInstallationEntry(appConfig);
        if (registrationPromise) {
            // A createInstallation request is in progress. Wait until it finishes.
            await registrationPromise;
        }
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    function extractAppConfig(app) {
        if (!app || !app.options) {
            throw getMissingValueError('App Configuration');
        }
        if (!app.name) {
            throw getMissingValueError('App Name');
        }
        // Required app config keys
        const configKeys = [
            'projectId',
            'apiKey',
            'appId'
        ];
        for (const keyName of configKeys) {
            if (!app.options[keyName]) {
                throw getMissingValueError(keyName);
            }
        }
        return {
            appName: app.name,
            projectId: app.options.projectId,
            apiKey: app.options.apiKey,
            appId: app.options.appId
        };
    }
    function getMissingValueError(valueName) {
        return ERROR_FACTORY$1.create("missing-app-config-values" /* MISSING_APP_CONFIG_VALUES */, {
            valueName
        });
    }

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const INSTALLATIONS_NAME = 'installations';
    const INSTALLATIONS_NAME_INTERNAL = 'installations-internal';
    const publicFactory = (container) => {
        const app = container.getProvider('app').getImmediate();
        // Throws if app isn't configured properly.
        const appConfig = extractAppConfig(app);
        const platformLoggerProvider = _getProvider(app, 'platform-logger');
        const installationsImpl = {
            app,
            appConfig,
            platformLoggerProvider,
            _delete: () => Promise.resolve()
        };
        return installationsImpl;
    };
    const internalFactory = (container) => {
        const app = container.getProvider('app').getImmediate();
        // Internal FIS instance relies on public FIS instance.
        const installations = _getProvider(app, INSTALLATIONS_NAME).getImmediate();
        const installationsInternal = {
            getId: () => getId(installations),
            getToken: (forceRefresh) => getToken(installations, forceRefresh)
        };
        return installationsInternal;
    };
    function registerInstallations() {
        _registerComponent(new Component(INSTALLATIONS_NAME, publicFactory, "PUBLIC" /* PUBLIC */));
        _registerComponent(new Component(INSTALLATIONS_NAME_INTERNAL, internalFactory, "PRIVATE" /* PRIVATE */));
    }

    /**
     * Firebase Installations
     *
     * @packageDocumentation
     */
    registerInstallations();
    registerVersion(name$1, version$2);
    // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
    registerVersion(name$1, version$2, 'esm2017');

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Type constant for Firebase Analytics.
     */
    const ANALYTICS_TYPE = 'analytics';
    // Key to attach FID to in gtag params.
    const GA_FID_KEY = 'firebase_id';
    const ORIGIN_KEY = 'origin';
    const FETCH_TIMEOUT_MILLIS = 60 * 1000;
    const DYNAMIC_CONFIG_URL = 'https://firebase.googleapis.com/v1alpha/projects/-/apps/{app-id}/webConfig';
    const GTAG_URL = 'https://www.googletagmanager.com/gtag/js';

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const logger = new Logger('@firebase/analytics');

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Makeshift polyfill for Promise.allSettled(). Resolves when all promises
     * have either resolved or rejected.
     *
     * @param promises Array of promises to wait for.
     */
    function promiseAllSettled(promises) {
        return Promise.all(promises.map(promise => promise.catch(e => e)));
    }
    /**
     * Inserts gtag script tag into the page to asynchronously download gtag.
     * @param dataLayerName Name of datalayer (most often the default, "_dataLayer").
     */
    function insertScriptTag(dataLayerName, measurementId) {
        const script = document.createElement('script');
        // We are not providing an analyticsId in the URL because it would trigger a `page_view`
        // without fid. We will initialize ga-id using gtag (config) command together with fid.
        script.src = `${GTAG_URL}?l=${dataLayerName}&id=${measurementId}`;
        script.async = true;
        document.head.appendChild(script);
    }
    /**
     * Get reference to, or create, global datalayer.
     * @param dataLayerName Name of datalayer (most often the default, "_dataLayer").
     */
    function getOrCreateDataLayer(dataLayerName) {
        // Check for existing dataLayer and create if needed.
        let dataLayer = [];
        if (Array.isArray(window[dataLayerName])) {
            dataLayer = window[dataLayerName];
        }
        else {
            window[dataLayerName] = dataLayer;
        }
        return dataLayer;
    }
    /**
     * Wrapped gtag logic when gtag is called with 'config' command.
     *
     * @param gtagCore Basic gtag function that just appends to dataLayer.
     * @param initializationPromisesMap Map of appIds to their initialization promises.
     * @param dynamicConfigPromisesList Array of dynamic config fetch promises.
     * @param measurementIdToAppId Map of GA measurementIDs to corresponding Firebase appId.
     * @param measurementId GA Measurement ID to set config for.
     * @param gtagParams Gtag config params to set.
     */
    async function gtagOnConfig(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, measurementId, gtagParams) {
        // If config is already fetched, we know the appId and can use it to look up what FID promise we
        /// are waiting for, and wait only on that one.
        const correspondingAppId = measurementIdToAppId[measurementId];
        try {
            if (correspondingAppId) {
                await initializationPromisesMap[correspondingAppId];
            }
            else {
                // If config is not fetched yet, wait for all configs (we don't know which one we need) and
                // find the appId (if any) corresponding to this measurementId. If there is one, wait on
                // that appId's initialization promise. If there is none, promise resolves and gtag
                // call goes through.
                const dynamicConfigResults = await promiseAllSettled(dynamicConfigPromisesList);
                const foundConfig = dynamicConfigResults.find(config => config.measurementId === measurementId);
                if (foundConfig) {
                    await initializationPromisesMap[foundConfig.appId];
                }
            }
        }
        catch (e) {
            logger.error(e);
        }
        gtagCore("config" /* CONFIG */, measurementId, gtagParams);
    }
    /**
     * Wrapped gtag logic when gtag is called with 'event' command.
     *
     * @param gtagCore Basic gtag function that just appends to dataLayer.
     * @param initializationPromisesMap Map of appIds to their initialization promises.
     * @param dynamicConfigPromisesList Array of dynamic config fetch promises.
     * @param measurementId GA Measurement ID to log event to.
     * @param gtagParams Params to log with this event.
     */
    async function gtagOnEvent(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementId, gtagParams) {
        try {
            let initializationPromisesToWaitFor = [];
            // If there's a 'send_to' param, check if any ID specified matches
            // an initializeIds() promise we are waiting for.
            if (gtagParams && gtagParams['send_to']) {
                let gaSendToList = gtagParams['send_to'];
                // Make it an array if is isn't, so it can be dealt with the same way.
                if (!Array.isArray(gaSendToList)) {
                    gaSendToList = [gaSendToList];
                }
                // Checking 'send_to' fields requires having all measurement ID results back from
                // the dynamic config fetch.
                const dynamicConfigResults = await promiseAllSettled(dynamicConfigPromisesList);
                for (const sendToId of gaSendToList) {
                    // Any fetched dynamic measurement ID that matches this 'send_to' ID
                    const foundConfig = dynamicConfigResults.find(config => config.measurementId === sendToId);
                    const initializationPromise = foundConfig && initializationPromisesMap[foundConfig.appId];
                    if (initializationPromise) {
                        initializationPromisesToWaitFor.push(initializationPromise);
                    }
                    else {
                        // Found an item in 'send_to' that is not associated
                        // directly with an FID, possibly a group.  Empty this array,
                        // exit the loop early, and let it get populated below.
                        initializationPromisesToWaitFor = [];
                        break;
                    }
                }
            }
            // This will be unpopulated if there was no 'send_to' field , or
            // if not all entries in the 'send_to' field could be mapped to
            // a FID. In these cases, wait on all pending initialization promises.
            if (initializationPromisesToWaitFor.length === 0) {
                initializationPromisesToWaitFor = Object.values(initializationPromisesMap);
            }
            // Run core gtag function with args after all relevant initialization
            // promises have been resolved.
            await Promise.all(initializationPromisesToWaitFor);
            // Workaround for http://b/141370449 - third argument cannot be undefined.
            gtagCore("event" /* EVENT */, measurementId, gtagParams || {});
        }
        catch (e) {
            logger.error(e);
        }
    }
    /**
     * Wraps a standard gtag function with extra code to wait for completion of
     * relevant initialization promises before sending requests.
     *
     * @param gtagCore Basic gtag function that just appends to dataLayer.
     * @param initializationPromisesMap Map of appIds to their initialization promises.
     * @param dynamicConfigPromisesList Array of dynamic config fetch promises.
     * @param measurementIdToAppId Map of GA measurementIDs to corresponding Firebase appId.
     */
    function wrapGtag(gtagCore, 
    /**
     * Allows wrapped gtag calls to wait on whichever intialization promises are required,
     * depending on the contents of the gtag params' `send_to` field, if any.
     */
    initializationPromisesMap, 
    /**
     * Wrapped gtag calls sometimes require all dynamic config fetches to have returned
     * before determining what initialization promises (which include FIDs) to wait for.
     */
    dynamicConfigPromisesList, 
    /**
     * Wrapped gtag config calls can narrow down which initialization promise (with FID)
     * to wait for if the measurementId is already fetched, by getting the corresponding appId,
     * which is the key for the initialization promises map.
     */
    measurementIdToAppId) {
        /**
         * Wrapper around gtag that ensures FID is sent with gtag calls.
         * @param command Gtag command type.
         * @param idOrNameOrParams Measurement ID if command is EVENT/CONFIG, params if command is SET.
         * @param gtagParams Params if event is EVENT/CONFIG.
         */
        async function gtagWrapper(command, idOrNameOrParams, gtagParams) {
            try {
                // If event, check that relevant initialization promises have completed.
                if (command === "event" /* EVENT */) {
                    // If EVENT, second arg must be measurementId.
                    await gtagOnEvent(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, idOrNameOrParams, gtagParams);
                }
                else if (command === "config" /* CONFIG */) {
                    // If CONFIG, second arg must be measurementId.
                    await gtagOnConfig(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, idOrNameOrParams, gtagParams);
                }
                else {
                    // If SET, second arg must be params.
                    gtagCore("set" /* SET */, idOrNameOrParams);
                }
            }
            catch (e) {
                logger.error(e);
            }
        }
        return gtagWrapper;
    }
    /**
     * Creates global gtag function or wraps existing one if found.
     * This wrapped function attaches Firebase instance ID (FID) to gtag 'config' and
     * 'event' calls that belong to the GAID associated with this Firebase instance.
     *
     * @param initializationPromisesMap Map of appIds to their initialization promises.
     * @param dynamicConfigPromisesList Array of dynamic config fetch promises.
     * @param measurementIdToAppId Map of GA measurementIDs to corresponding Firebase appId.
     * @param dataLayerName Name of global GA datalayer array.
     * @param gtagFunctionName Name of global gtag function ("gtag" if not user-specified).
     */
    function wrapOrCreateGtag(initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, dataLayerName, gtagFunctionName) {
        // Create a basic core gtag function
        let gtagCore = function (..._args) {
            // Must push IArguments object, not an array.
            window[dataLayerName].push(arguments);
        };
        // Replace it with existing one if found
        if (window[gtagFunctionName] &&
            typeof window[gtagFunctionName] === 'function') {
            // @ts-ignore
            gtagCore = window[gtagFunctionName];
        }
        window[gtagFunctionName] = wrapGtag(gtagCore, initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId);
        return {
            gtagCore,
            wrappedGtag: window[gtagFunctionName]
        };
    }
    /**
     * Returns first script tag in DOM matching our gtag url pattern.
     */
    function findGtagScriptOnPage() {
        const scriptTags = window.document.getElementsByTagName('script');
        for (const tag of Object.values(scriptTags)) {
            if (tag.src && tag.src.includes(GTAG_URL)) {
                return tag;
            }
        }
        return null;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    const ERRORS = {
        ["already-exists" /* ALREADY_EXISTS */]: 'A Firebase Analytics instance with the appId {$id} ' +
            ' already exists. ' +
            'Only one Firebase Analytics instance can be created for each appId.',
        ["already-initialized" /* ALREADY_INITIALIZED */]: 'initializeAnalytics() cannot be called again with different options than those ' +
            'it was initially called with. It can be called again with the same options to ' +
            'return the existing instance, or getAnalytics() can be used ' +
            'to get a reference to the already-intialized instance.',
        ["already-initialized-settings" /* ALREADY_INITIALIZED_SETTINGS */]: 'Firebase Analytics has already been initialized.' +
            'settings() must be called before initializing any Analytics instance' +
            'or it will have no effect.',
        ["interop-component-reg-failed" /* INTEROP_COMPONENT_REG_FAILED */]: 'Firebase Analytics Interop Component failed to instantiate: {$reason}',
        ["invalid-analytics-context" /* INVALID_ANALYTICS_CONTEXT */]: 'Firebase Analytics is not supported in this environment. ' +
            'Wrap initialization of analytics in analytics.isSupported() ' +
            'to prevent initialization in unsupported environments. Details: {$errorInfo}',
        ["indexeddb-unavailable" /* INDEXEDDB_UNAVAILABLE */]: 'IndexedDB unavailable or restricted in this environment. ' +
            'Wrap initialization of analytics in analytics.isSupported() ' +
            'to prevent initialization in unsupported environments. Details: {$errorInfo}',
        ["fetch-throttle" /* FETCH_THROTTLE */]: 'The config fetch request timed out while in an exponential backoff state.' +
            ' Unix timestamp in milliseconds when fetch request throttling ends: {$throttleEndTimeMillis}.',
        ["config-fetch-failed" /* CONFIG_FETCH_FAILED */]: 'Dynamic config fetch failed: [{$httpStatus}] {$responseMessage}',
        ["no-api-key" /* NO_API_KEY */]: 'The "apiKey" field is empty in the local Firebase config. Firebase Analytics requires this field to' +
            'contain a valid API key.',
        ["no-app-id" /* NO_APP_ID */]: 'The "appId" field is empty in the local Firebase config. Firebase Analytics requires this field to' +
            'contain a valid app ID.'
    };
    const ERROR_FACTORY = new ErrorFactory('analytics', 'Analytics', ERRORS);

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Backoff factor for 503 errors, which we want to be conservative about
     * to avoid overloading servers. Each retry interval will be
     * BASE_INTERVAL_MILLIS * LONG_RETRY_FACTOR ^ retryCount, so the second one
     * will be ~30 seconds (with fuzzing).
     */
    const LONG_RETRY_FACTOR = 30;
    /**
     * Base wait interval to multiplied by backoffFactor^backoffCount.
     */
    const BASE_INTERVAL_MILLIS = 1000;
    /**
     * Stubbable retry data storage class.
     */
    class RetryData {
        constructor(throttleMetadata = {}, intervalMillis = BASE_INTERVAL_MILLIS) {
            this.throttleMetadata = throttleMetadata;
            this.intervalMillis = intervalMillis;
        }
        getThrottleMetadata(appId) {
            return this.throttleMetadata[appId];
        }
        setThrottleMetadata(appId, metadata) {
            this.throttleMetadata[appId] = metadata;
        }
        deleteThrottleMetadata(appId) {
            delete this.throttleMetadata[appId];
        }
    }
    const defaultRetryData = new RetryData();
    /**
     * Set GET request headers.
     * @param apiKey App API key.
     */
    function getHeaders(apiKey) {
        return new Headers({
            Accept: 'application/json',
            'x-goog-api-key': apiKey
        });
    }
    /**
     * Fetches dynamic config from backend.
     * @param app Firebase app to fetch config for.
     */
    async function fetchDynamicConfig(appFields) {
        var _a;
        const { appId, apiKey } = appFields;
        const request = {
            method: 'GET',
            headers: getHeaders(apiKey)
        };
        const appUrl = DYNAMIC_CONFIG_URL.replace('{app-id}', appId);
        const response = await fetch(appUrl, request);
        if (response.status !== 200 && response.status !== 304) {
            let errorMessage = '';
            try {
                // Try to get any error message text from server response.
                const jsonResponse = (await response.json());
                if ((_a = jsonResponse.error) === null || _a === void 0 ? void 0 : _a.message) {
                    errorMessage = jsonResponse.error.message;
                }
            }
            catch (_ignored) { }
            throw ERROR_FACTORY.create("config-fetch-failed" /* CONFIG_FETCH_FAILED */, {
                httpStatus: response.status,
                responseMessage: errorMessage
            });
        }
        return response.json();
    }
    /**
     * Fetches dynamic config from backend, retrying if failed.
     * @param app Firebase app to fetch config for.
     */
    async function fetchDynamicConfigWithRetry(app, 
    // retryData and timeoutMillis are parameterized to allow passing a different value for testing.
    retryData = defaultRetryData, timeoutMillis) {
        const { appId, apiKey, measurementId } = app.options;
        if (!appId) {
            throw ERROR_FACTORY.create("no-app-id" /* NO_APP_ID */);
        }
        if (!apiKey) {
            if (measurementId) {
                return {
                    measurementId,
                    appId
                };
            }
            throw ERROR_FACTORY.create("no-api-key" /* NO_API_KEY */);
        }
        const throttleMetadata = retryData.getThrottleMetadata(appId) || {
            backoffCount: 0,
            throttleEndTimeMillis: Date.now()
        };
        const signal = new AnalyticsAbortSignal();
        setTimeout(async () => {
            // Note a very low delay, eg < 10ms, can elapse before listeners are initialized.
            signal.abort();
        }, timeoutMillis !== undefined ? timeoutMillis : FETCH_TIMEOUT_MILLIS);
        return attemptFetchDynamicConfigWithRetry({ appId, apiKey, measurementId }, throttleMetadata, signal, retryData);
    }
    /**
     * Runs one retry attempt.
     * @param appFields Necessary app config fields.
     * @param throttleMetadata Ongoing metadata to determine throttling times.
     * @param signal Abort signal.
     */
    async function attemptFetchDynamicConfigWithRetry(appFields, { throttleEndTimeMillis, backoffCount }, signal, retryData = defaultRetryData // for testing
    ) {
        const { appId, measurementId } = appFields;
        // Starts with a (potentially zero) timeout to support resumption from stored state.
        // Ensures the throttle end time is honored if the last attempt timed out.
        // Note the SDK will never make a request if the fetch timeout expires at this point.
        try {
            await setAbortableTimeout(signal, throttleEndTimeMillis);
        }
        catch (e) {
            if (measurementId) {
                logger.warn(`Timed out fetching this Firebase app's measurement ID from the server.` +
                    ` Falling back to the measurement ID ${measurementId}` +
                    ` provided in the "measurementId" field in the local Firebase config. [${e.message}]`);
                return { appId, measurementId };
            }
            throw e;
        }
        try {
            const response = await fetchDynamicConfig(appFields);
            // Note the SDK only clears throttle state if response is success or non-retriable.
            retryData.deleteThrottleMetadata(appId);
            return response;
        }
        catch (e) {
            if (!isRetriableError(e)) {
                retryData.deleteThrottleMetadata(appId);
                if (measurementId) {
                    logger.warn(`Failed to fetch this Firebase app's measurement ID from the server.` +
                        ` Falling back to the measurement ID ${measurementId}` +
                        ` provided in the "measurementId" field in the local Firebase config. [${e.message}]`);
                    return { appId, measurementId };
                }
                else {
                    throw e;
                }
            }
            const backoffMillis = Number(e.customData.httpStatus) === 503
                ? calculateBackoffMillis(backoffCount, retryData.intervalMillis, LONG_RETRY_FACTOR)
                : calculateBackoffMillis(backoffCount, retryData.intervalMillis);
            // Increments backoff state.
            const throttleMetadata = {
                throttleEndTimeMillis: Date.now() + backoffMillis,
                backoffCount: backoffCount + 1
            };
            // Persists state.
            retryData.setThrottleMetadata(appId, throttleMetadata);
            logger.debug(`Calling attemptFetch again in ${backoffMillis} millis`);
            return attemptFetchDynamicConfigWithRetry(appFields, throttleMetadata, signal, retryData);
        }
    }
    /**
     * Supports waiting on a backoff by:
     *
     * <ul>
     *   <li>Promisifying setTimeout, so we can set a timeout in our Promise chain</li>
     *   <li>Listening on a signal bus for abort events, just like the Fetch API</li>
     *   <li>Failing in the same way the Fetch API fails, so timing out a live request and a throttled
     *       request appear the same.</li>
     * </ul>
     *
     * <p>Visible for testing.
     */
    function setAbortableTimeout(signal, throttleEndTimeMillis) {
        return new Promise((resolve, reject) => {
            // Derives backoff from given end time, normalizing negative numbers to zero.
            const backoffMillis = Math.max(throttleEndTimeMillis - Date.now(), 0);
            const timeout = setTimeout(resolve, backoffMillis);
            // Adds listener, rather than sets onabort, because signal is a shared object.
            signal.addEventListener(() => {
                clearTimeout(timeout);
                // If the request completes before this timeout, the rejection has no effect.
                reject(ERROR_FACTORY.create("fetch-throttle" /* FETCH_THROTTLE */, {
                    throttleEndTimeMillis
                }));
            });
        });
    }
    /**
     * Returns true if the {@link Error} indicates a fetch request may succeed later.
     */
    function isRetriableError(e) {
        if (!(e instanceof FirebaseError) || !e.customData) {
            return false;
        }
        // Uses string index defined by ErrorData, which FirebaseError implements.
        const httpStatus = Number(e.customData['httpStatus']);
        return (httpStatus === 429 ||
            httpStatus === 500 ||
            httpStatus === 503 ||
            httpStatus === 504);
    }
    /**
     * Shims a minimal AbortSignal (copied from Remote Config).
     *
     * <p>AbortController's AbortSignal conveniently decouples fetch timeout logic from other aspects
     * of networking, such as retries. Firebase doesn't use AbortController enough to justify a
     * polyfill recommendation, like we do with the Fetch API, but this minimal shim can easily be
     * swapped out if/when we do.
     */
    class AnalyticsAbortSignal {
        constructor() {
            this.listeners = [];
        }
        addEventListener(listener) {
            this.listeners.push(listener);
        }
        abort() {
            this.listeners.forEach(listener => listener());
        }
    }

    /**
     * @license
     * Copyright 2020 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    async function validateIndexedDB() {
        if (!isIndexedDBAvailable()) {
            logger.warn(ERROR_FACTORY.create("indexeddb-unavailable" /* INDEXEDDB_UNAVAILABLE */, {
                errorInfo: 'IndexedDB is not available in this environment.'
            }).message);
            return false;
        }
        else {
            try {
                await validateIndexedDBOpenable();
            }
            catch (e) {
                logger.warn(ERROR_FACTORY.create("indexeddb-unavailable" /* INDEXEDDB_UNAVAILABLE */, {
                    errorInfo: e
                }).message);
                return false;
            }
        }
        return true;
    }
    /**
     * Initialize the analytics instance in gtag.js by calling config command with fid.
     *
     * NOTE: We combine analytics initialization and setting fid together because we want fid to be
     * part of the `page_view` event that's sent during the initialization
     * @param app Firebase app
     * @param gtagCore The gtag function that's not wrapped.
     * @param dynamicConfigPromisesList Array of all dynamic config promises.
     * @param measurementIdToAppId Maps measurementID to appID.
     * @param installations _FirebaseInstallationsInternal instance.
     *
     * @returns Measurement ID.
     */
    async function _initializeAnalytics(app, dynamicConfigPromisesList, measurementIdToAppId, installations, gtagCore, dataLayerName, options) {
        var _a;
        const dynamicConfigPromise = fetchDynamicConfigWithRetry(app);
        // Once fetched, map measurementIds to appId, for ease of lookup in wrapped gtag function.
        dynamicConfigPromise
            .then(config => {
            measurementIdToAppId[config.measurementId] = config.appId;
            if (app.options.measurementId &&
                config.measurementId !== app.options.measurementId) {
                logger.warn(`The measurement ID in the local Firebase config (${app.options.measurementId})` +
                    ` does not match the measurement ID fetched from the server (${config.measurementId}).` +
                    ` To ensure analytics events are always sent to the correct Analytics property,` +
                    ` update the` +
                    ` measurement ID field in the local config or remove it from the local config.`);
            }
        })
            .catch(e => logger.error(e));
        // Add to list to track state of all dynamic config promises.
        dynamicConfigPromisesList.push(dynamicConfigPromise);
        const fidPromise = validateIndexedDB().then(envIsValid => {
            if (envIsValid) {
                return installations.getId();
            }
            else {
                return undefined;
            }
        });
        const [dynamicConfig, fid] = await Promise.all([
            dynamicConfigPromise,
            fidPromise
        ]);
        // Detect if user has already put the gtag <script> tag on this page.
        if (!findGtagScriptOnPage()) {
            insertScriptTag(dataLayerName, dynamicConfig.measurementId);
        }
        // This command initializes gtag.js and only needs to be called once for the entire web app,
        // but since it is idempotent, we can call it multiple times.
        // We keep it together with other initialization logic for better code structure.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        gtagCore('js', new Date());
        // User config added first. We don't want users to accidentally overwrite
        // base Firebase config properties.
        const configProperties = (_a = options === null || options === void 0 ? void 0 : options.config) !== null && _a !== void 0 ? _a : {};
        // guard against developers accidentally setting properties with prefix `firebase_`
        configProperties[ORIGIN_KEY] = 'firebase';
        configProperties.update = true;
        if (fid != null) {
            configProperties[GA_FID_KEY] = fid;
        }
        // It should be the first config command called on this GA-ID
        // Initialize this GA-ID and set FID on it using the gtag config API.
        // Note: This will trigger a page_view event unless 'send_page_view' is set to false in
        // `configProperties`.
        gtagCore("config" /* CONFIG */, dynamicConfig.measurementId, configProperties);
        return dynamicConfig.measurementId;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Analytics Service class.
     */
    class AnalyticsService {
        constructor(app) {
            this.app = app;
        }
        _delete() {
            delete initializationPromisesMap[this.app.options.appId];
            return Promise.resolve();
        }
    }
    /**
     * Maps appId to full initialization promise. Wrapped gtag calls must wait on
     * all or some of these, depending on the call's `send_to` param and the status
     * of the dynamic config fetches (see below).
     */
    let initializationPromisesMap = {};
    /**
     * List of dynamic config fetch promises. In certain cases, wrapped gtag calls
     * wait on all these to be complete in order to determine if it can selectively
     * wait for only certain initialization (FID) promises or if it must wait for all.
     */
    let dynamicConfigPromisesList = [];
    /**
     * Maps fetched measurementIds to appId. Populated when the app's dynamic config
     * fetch completes. If already populated, gtag config calls can use this to
     * selectively wait for only this app's initialization promise (FID) instead of all
     * initialization promises.
     */
    const measurementIdToAppId = {};
    /**
     * Name for window global data layer array used by GA: defaults to 'dataLayer'.
     */
    let dataLayerName = 'dataLayer';
    /**
     * Name for window global gtag function used by GA: defaults to 'gtag'.
     */
    let gtagName = 'gtag';
    /**
     * Reproduction of standard gtag function or reference to existing
     * gtag function on window object.
     */
    let gtagCoreFunction;
    /**
     * Wrapper around gtag function that ensures FID is sent with all
     * relevant event and config calls.
     */
    let wrappedGtagFunction;
    /**
     * Flag to ensure page initialization steps (creation or wrapping of
     * dataLayer and gtag script) are only run once per page load.
     */
    let globalInitDone = false;
    /**
     * Returns true if no environment mismatch is found.
     * If environment mismatches are found, throws an INVALID_ANALYTICS_CONTEXT
     * error that also lists details for each mismatch found.
     */
    function warnOnBrowserContextMismatch() {
        const mismatchedEnvMessages = [];
        if (isBrowserExtension()) {
            mismatchedEnvMessages.push('This is a browser extension environment.');
        }
        if (!areCookiesEnabled()) {
            mismatchedEnvMessages.push('Cookies are not available.');
        }
        if (mismatchedEnvMessages.length > 0) {
            const details = mismatchedEnvMessages
                .map((message, index) => `(${index + 1}) ${message}`)
                .join(' ');
            const err = ERROR_FACTORY.create("invalid-analytics-context" /* INVALID_ANALYTICS_CONTEXT */, {
                errorInfo: details
            });
            logger.warn(err.message);
        }
    }
    /**
     * Analytics instance factory.
     * @internal
     */
    function factory(app, installations, options) {
        warnOnBrowserContextMismatch();
        const appId = app.options.appId;
        if (!appId) {
            throw ERROR_FACTORY.create("no-app-id" /* NO_APP_ID */);
        }
        if (!app.options.apiKey) {
            if (app.options.measurementId) {
                logger.warn(`The "apiKey" field is empty in the local Firebase config. This is needed to fetch the latest` +
                    ` measurement ID for this Firebase app. Falling back to the measurement ID ${app.options.measurementId}` +
                    ` provided in the "measurementId" field in the local Firebase config.`);
            }
            else {
                throw ERROR_FACTORY.create("no-api-key" /* NO_API_KEY */);
            }
        }
        if (initializationPromisesMap[appId] != null) {
            throw ERROR_FACTORY.create("already-exists" /* ALREADY_EXISTS */, {
                id: appId
            });
        }
        if (!globalInitDone) {
            // Steps here should only be done once per page: creation or wrapping
            // of dataLayer and global gtag function.
            getOrCreateDataLayer(dataLayerName);
            const { wrappedGtag, gtagCore } = wrapOrCreateGtag(initializationPromisesMap, dynamicConfigPromisesList, measurementIdToAppId, dataLayerName, gtagName);
            wrappedGtagFunction = wrappedGtag;
            gtagCoreFunction = gtagCore;
            globalInitDone = true;
        }
        // Async but non-blocking.
        // This map reflects the completion state of all promises for each appId.
        initializationPromisesMap[appId] = _initializeAnalytics(app, dynamicConfigPromisesList, measurementIdToAppId, installations, gtagCoreFunction, dataLayerName, options);
        const analyticsInstance = new AnalyticsService(app);
        return analyticsInstance;
    }

    /**
     * @license
     * Copyright 2019 Google LLC
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *   http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    /**
     * Logs an analytics event through the Firebase SDK.
     *
     * @param gtagFunction Wrapped gtag function that waits for fid to be set before sending an event
     * @param eventName Google Analytics event name, choose from standard list or use a custom string.
     * @param eventParams Analytics event parameters.
     */
    async function logEvent$1(gtagFunction, initializationPromise, eventName, eventParams, options) {
        if (options && options.global) {
            gtagFunction("event" /* EVENT */, eventName, eventParams);
            return;
        }
        else {
            const measurementId = await initializationPromise;
            const params = Object.assign(Object.assign({}, eventParams), { 'send_to': measurementId });
            gtagFunction("event" /* EVENT */, eventName, params);
        }
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    /**
     * Returns an {@link Analytics} instance for the given app.
     *
     * @public
     *
     * @param app - The {@link @firebase/app#FirebaseApp} to use.
     */
    function getAnalytics(app = getApp()) {
        app = getModularInstance(app);
        // Dependencies
        const analyticsProvider = _getProvider(app, ANALYTICS_TYPE);
        if (analyticsProvider.isInitialized()) {
            return analyticsProvider.getImmediate();
        }
        return initializeAnalytics(app);
    }
    /**
     * Returns an {@link Analytics} instance for the given app.
     *
     * @public
     *
     * @param app - The {@link @firebase/app#FirebaseApp} to use.
     */
    function initializeAnalytics(app, options = {}) {
        // Dependencies
        const analyticsProvider = _getProvider(app, ANALYTICS_TYPE);
        if (analyticsProvider.isInitialized()) {
            const existingInstance = analyticsProvider.getImmediate();
            if (deepEqual(options, analyticsProvider.getOptions())) {
                return existingInstance;
            }
            else {
                throw ERROR_FACTORY.create("already-initialized" /* ALREADY_INITIALIZED */);
            }
        }
        const analyticsInstance = analyticsProvider.initialize({ options });
        return analyticsInstance;
    }
    /**
     * Sends a Google Analytics event with given `eventParams`. This method
     * automatically associates this logged event with this Firebase web
     * app instance on this device.
     * List of official event parameters can be found in the gtag.js
     * reference documentation:
     * {@link https://developers.google.com/gtagjs/reference/ga4-events
     * | the GA4 reference documentation}.
     *
     * @public
     */
    function logEvent(analyticsInstance, eventName, eventParams, options) {
        analyticsInstance = getModularInstance(analyticsInstance);
        logEvent$1(wrappedGtagFunction, initializationPromisesMap[analyticsInstance.app.options.appId], eventName, eventParams, options).catch(e => logger.error(e));
    }

    const name = "@firebase/analytics";
    const version$1 = "0.7.4";

    /**
     * Firebase Analytics
     *
     * @packageDocumentation
     */
    function registerAnalytics() {
        _registerComponent(new Component(ANALYTICS_TYPE, (container, { options: analyticsOptions }) => {
            // getImmediate for FirebaseApp will always succeed
            const app = container.getProvider('app').getImmediate();
            const installations = container
                .getProvider('installations-internal')
                .getImmediate();
            return factory(app, installations, analyticsOptions);
        }, "PUBLIC" /* PUBLIC */));
        _registerComponent(new Component('analytics-internal', internalFactory, "PRIVATE" /* PRIVATE */));
        registerVersion(name, version$1);
        // BUILD_TARGET will be replaced by values like esm5, esm2017, cjs5, etc during the compilation
        registerVersion(name, version$1, 'esm2017');
        function internalFactory(container) {
            try {
                const analytics = container.getProvider(ANALYTICS_TYPE).getImmediate();
                return {
                    logEvent: (eventName, eventParams, options) => logEvent(analytics, eventName, eventParams, options)
                };
            }
            catch (e) {
                throw ERROR_FACTORY.create("interop-component-reg-failed" /* INTEROP_COMPONENT_REG_FAILED */, {
                    reason: e
                });
            }
        }
    }
    registerAnalytics();

    // Import the functions you need from the SDKs you need
    // TODO: Add SDKs for Firebase products that you want to use
    // https://firebase.google.com/docs/web/setup#available-libraries

    // Your web app's Firebase configuration
    // For Firebase JS SDK v7.20.0 and later, measurementId is optional
    const firebaseConfig = {
      apiKey: "AIzaSyAWT4pc_UP_e7DaqP6VJ_cbDatK3oNNSgM",
      authDomain: "segnali-e-misure.firebaseapp.com",
      databaseURL: "https://segnali-e-misure-default-rtdb.europe-west1.firebasedatabase.app",
      projectId: "segnali-e-misure",
      storageBucket: "segnali-e-misure.appspot.com",
      messagingSenderId: "990634275920",
      appId: "1:990634275920:web:db6350ea514bb5ca2ccd55",
      measurementId: "G-DVKMVH7EZZ"
    };

    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    getAnalytics(app);

    /**
     * @license
     * Copyright 2019 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    const t$1=window.ShadowRoot&&(void 0===window.ShadyCSS||window.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,e$2=Symbol(),n$3=new Map;class s$3{constructor(t,n){if(this._$cssResult$=!0,n!==e$2)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t;}get styleSheet(){let e=n$3.get(this.cssText);return t$1&&void 0===e&&(n$3.set(this.cssText,e=new CSSStyleSheet),e.replaceSync(this.cssText)),e}toString(){return this.cssText}}const o$3=t=>new s$3("string"==typeof t?t:t+"",e$2),i$1=(e,n)=>{t$1?e.adoptedStyleSheets=n.map((t=>t instanceof CSSStyleSheet?t:t.styleSheet)):n.forEach((t=>{const n=document.createElement("style"),s=window.litNonce;void 0!==s&&n.setAttribute("nonce",s),n.textContent=t.cssText,e.appendChild(n);}));},S$1=t$1?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const n of t.cssRules)e+=n.cssText;return o$3(e)})(t):t;

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */var s$2;const e$1=window.trustedTypes,r$1=e$1?e$1.emptyScript:"",h$1=window.reactiveElementPolyfillSupport,o$2={toAttribute(t,i){switch(i){case Boolean:t=t?r$1:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t);}return t},fromAttribute(t,i){let s=t;switch(i){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t);}catch(t){s=null;}}return s}},n$2=(t,i)=>i!==t&&(i==i||t==t),l$2={attribute:!0,type:String,converter:o$2,reflect:!1,hasChanged:n$2};class a$1 extends HTMLElement{constructor(){super(),this._$Et=new Map,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Ei=null,this.o();}static addInitializer(t){var i;null!==(i=this.l)&&void 0!==i||(this.l=[]),this.l.push(t);}static get observedAttributes(){this.finalize();const t=[];return this.elementProperties.forEach(((i,s)=>{const e=this._$Eh(s,i);void 0!==e&&(this._$Eu.set(e,s),t.push(e));})),t}static createProperty(t,i=l$2){if(i.state&&(i.attribute=!1),this.finalize(),this.elementProperties.set(t,i),!i.noAccessor&&!this.prototype.hasOwnProperty(t)){const s="symbol"==typeof t?Symbol():"__"+t,e=this.getPropertyDescriptor(t,s,i);void 0!==e&&Object.defineProperty(this.prototype,t,e);}}static getPropertyDescriptor(t,i,s){return {get(){return this[i]},set(e){const r=this[t];this[i]=e,this.requestUpdate(t,r,s);},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)||l$2}static finalize(){if(this.hasOwnProperty("finalized"))return !1;this.finalized=!0;const t=Object.getPrototypeOf(this);if(t.finalize(),this.elementProperties=new Map(t.elementProperties),this._$Eu=new Map,this.hasOwnProperty("properties")){const t=this.properties,i=[...Object.getOwnPropertyNames(t),...Object.getOwnPropertySymbols(t)];for(const s of i)this.createProperty(s,t[s]);}return this.elementStyles=this.finalizeStyles(this.styles),!0}static finalizeStyles(i){const s=[];if(Array.isArray(i)){const e=new Set(i.flat(1/0).reverse());for(const i of e)s.unshift(S$1(i));}else void 0!==i&&s.push(S$1(i));return s}static _$Eh(t,i){const s=i.attribute;return !1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}o(){var t;this._$Ep=new Promise((t=>this.enableUpdating=t)),this._$AL=new Map,this._$Em(),this.requestUpdate(),null===(t=this.constructor.l)||void 0===t||t.forEach((t=>t(this)));}addController(t){var i,s;(null!==(i=this._$Eg)&&void 0!==i?i:this._$Eg=[]).push(t),void 0!==this.renderRoot&&this.isConnected&&(null===(s=t.hostConnected)||void 0===s||s.call(t));}removeController(t){var i;null===(i=this._$Eg)||void 0===i||i.splice(this._$Eg.indexOf(t)>>>0,1);}_$Em(){this.constructor.elementProperties.forEach(((t,i)=>{this.hasOwnProperty(i)&&(this._$Et.set(i,this[i]),delete this[i]);}));}createRenderRoot(){var t;const s=null!==(t=this.shadowRoot)&&void 0!==t?t:this.attachShadow(this.constructor.shadowRootOptions);return i$1(s,this.constructor.elementStyles),s}connectedCallback(){var t;void 0===this.renderRoot&&(this.renderRoot=this.createRenderRoot()),this.enableUpdating(!0),null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostConnected)||void 0===i?void 0:i.call(t)}));}enableUpdating(t){}disconnectedCallback(){var t;null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostDisconnected)||void 0===i?void 0:i.call(t)}));}attributeChangedCallback(t,i,s){this._$AK(t,s);}_$ES(t,i,s=l$2){var e,r;const h=this.constructor._$Eh(t,s);if(void 0!==h&&!0===s.reflect){const n=(null!==(r=null===(e=s.converter)||void 0===e?void 0:e.toAttribute)&&void 0!==r?r:o$2.toAttribute)(i,s.type);this._$Ei=t,null==n?this.removeAttribute(h):this.setAttribute(h,n),this._$Ei=null;}}_$AK(t,i){var s,e,r;const h=this.constructor,n=h._$Eu.get(t);if(void 0!==n&&this._$Ei!==n){const t=h.getPropertyOptions(n),l=t.converter,a=null!==(r=null!==(e=null===(s=l)||void 0===s?void 0:s.fromAttribute)&&void 0!==e?e:"function"==typeof l?l:null)&&void 0!==r?r:o$2.fromAttribute;this._$Ei=n,this[n]=a(i,t.type),this._$Ei=null;}}requestUpdate(t,i,s){let e=!0;void 0!==t&&(((s=s||this.constructor.getPropertyOptions(t)).hasChanged||n$2)(this[t],i)?(this._$AL.has(t)||this._$AL.set(t,i),!0===s.reflect&&this._$Ei!==t&&(void 0===this._$E_&&(this._$E_=new Map),this._$E_.set(t,s))):e=!1),!this.isUpdatePending&&e&&(this._$Ep=this._$EC());}async _$EC(){this.isUpdatePending=!0;try{await this._$Ep;}catch(t){Promise.reject(t);}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){var t;if(!this.isUpdatePending)return;this.hasUpdated,this._$Et&&(this._$Et.forEach(((t,i)=>this[i]=t)),this._$Et=void 0);let i=!1;const s=this._$AL;try{i=this.shouldUpdate(s),i?(this.willUpdate(s),null===(t=this._$Eg)||void 0===t||t.forEach((t=>{var i;return null===(i=t.hostUpdate)||void 0===i?void 0:i.call(t)})),this.update(s)):this._$EU();}catch(t){throw i=!1,this._$EU(),t}i&&this._$AE(s);}willUpdate(t){}_$AE(t){var i;null===(i=this._$Eg)||void 0===i||i.forEach((t=>{var i;return null===(i=t.hostUpdated)||void 0===i?void 0:i.call(t)})),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t);}_$EU(){this._$AL=new Map,this.isUpdatePending=!1;}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$Ep}shouldUpdate(t){return !0}update(t){void 0!==this._$E_&&(this._$E_.forEach(((t,i)=>this._$ES(i,this[i],t))),this._$E_=void 0),this._$EU();}updated(t){}firstUpdated(t){}}a$1.finalized=!0,a$1.elementProperties=new Map,a$1.elementStyles=[],a$1.shadowRootOptions={mode:"open"},null==h$1||h$1({ReactiveElement:a$1}),(null!==(s$2=globalThis.reactiveElementVersions)&&void 0!==s$2?s$2:globalThis.reactiveElementVersions=[]).push("1.0.2");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */
    var t;const i=globalThis.trustedTypes,s$1=i?i.createPolicy("lit-html",{createHTML:t=>t}):void 0,e=`lit$${(Math.random()+"").slice(9)}$`,o$1="?"+e,n$1=`<${o$1}>`,l$1=document,h=(t="")=>l$1.createComment(t),r=t=>null===t||"object"!=typeof t&&"function"!=typeof t,d=Array.isArray,u=t=>{var i;return d(t)||"function"==typeof(null===(i=t)||void 0===i?void 0:i[Symbol.iterator])},c=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,v=/-->/g,a=/>/g,f=/>|[ 	\n\r](?:([^\s"'>=/]+)([ 	\n\r]*=[ 	\n\r]*(?:[^ 	\n\r"'`<>=]|("|')|))|$)/g,_=/'/g,m=/"/g,g=/^(?:script|style|textarea)$/i,$=t=>(i,...s)=>({_$litType$:t,strings:i,values:s}),p=$(1),b=Symbol.for("lit-noChange"),T=Symbol.for("lit-nothing"),x=new WeakMap,w=(t,i,s)=>{var e,o;const n=null!==(e=null==s?void 0:s.renderBefore)&&void 0!==e?e:i;let l=n._$litPart$;if(void 0===l){const t=null!==(o=null==s?void 0:s.renderBefore)&&void 0!==o?o:null;n._$litPart$=l=new N(i.insertBefore(h(),t),t,void 0,null!=s?s:{});}return l._$AI(t),l},A=l$1.createTreeWalker(l$1,129,null,!1),C=(t,i)=>{const o=t.length-1,l=[];let h,r=2===i?"<svg>":"",d=c;for(let i=0;i<o;i++){const s=t[i];let o,u,$=-1,p=0;for(;p<s.length&&(d.lastIndex=p,u=d.exec(s),null!==u);)p=d.lastIndex,d===c?"!--"===u[1]?d=v:void 0!==u[1]?d=a:void 0!==u[2]?(g.test(u[2])&&(h=RegExp("</"+u[2],"g")),d=f):void 0!==u[3]&&(d=f):d===f?">"===u[0]?(d=null!=h?h:c,$=-1):void 0===u[1]?$=-2:($=d.lastIndex-u[2].length,o=u[1],d=void 0===u[3]?f:'"'===u[3]?m:_):d===m||d===_?d=f:d===v||d===a?d=c:(d=f,h=void 0);const y=d===f&&t[i+1].startsWith("/>")?" ":"";r+=d===c?s+n$1:$>=0?(l.push(o),s.slice(0,$)+"$lit$"+s.slice($)+e+y):s+e+(-2===$?(l.push(void 0),i):y);}const u=r+(t[o]||"<?>")+(2===i?"</svg>":"");return [void 0!==s$1?s$1.createHTML(u):u,l]};class P{constructor({strings:t,_$litType$:s},n){let l;this.parts=[];let r=0,d=0;const u=t.length-1,c=this.parts,[v,a]=C(t,s);if(this.el=P.createElement(v,n),A.currentNode=this.el.content,2===s){const t=this.el.content,i=t.firstChild;i.remove(),t.append(...i.childNodes);}for(;null!==(l=A.nextNode())&&c.length<u;){if(1===l.nodeType){if(l.hasAttributes()){const t=[];for(const i of l.getAttributeNames())if(i.endsWith("$lit$")||i.startsWith(e)){const s=a[d++];if(t.push(i),void 0!==s){const t=l.getAttribute(s.toLowerCase()+"$lit$").split(e),i=/([.?@])?(.*)/.exec(s);c.push({type:1,index:r,name:i[2],strings:t,ctor:"."===i[1]?M:"?"===i[1]?H:"@"===i[1]?I:S});}else c.push({type:6,index:r});}for(const i of t)l.removeAttribute(i);}if(g.test(l.tagName)){const t=l.textContent.split(e),s=t.length-1;if(s>0){l.textContent=i?i.emptyScript:"";for(let i=0;i<s;i++)l.append(t[i],h()),A.nextNode(),c.push({type:2,index:++r});l.append(t[s],h());}}}else if(8===l.nodeType)if(l.data===o$1)c.push({type:2,index:r});else {let t=-1;for(;-1!==(t=l.data.indexOf(e,t+1));)c.push({type:7,index:r}),t+=e.length-1;}r++;}}static createElement(t,i){const s=l$1.createElement("template");return s.innerHTML=t,s}}function V(t,i,s=t,e){var o,n,l,h;if(i===b)return i;let d=void 0!==e?null===(o=s._$Cl)||void 0===o?void 0:o[e]:s._$Cu;const u=r(i)?void 0:i._$litDirective$;return (null==d?void 0:d.constructor)!==u&&(null===(n=null==d?void 0:d._$AO)||void 0===n||n.call(d,!1),void 0===u?d=void 0:(d=new u(t),d._$AT(t,s,e)),void 0!==e?(null!==(l=(h=s)._$Cl)&&void 0!==l?l:h._$Cl=[])[e]=d:s._$Cu=d),void 0!==d&&(i=V(t,d._$AS(t,i.values),d,e)),i}class E{constructor(t,i){this.v=[],this._$AN=void 0,this._$AD=t,this._$AM=i;}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}p(t){var i;const{el:{content:s},parts:e}=this._$AD,o=(null!==(i=null==t?void 0:t.creationScope)&&void 0!==i?i:l$1).importNode(s,!0);A.currentNode=o;let n=A.nextNode(),h=0,r=0,d=e[0];for(;void 0!==d;){if(h===d.index){let i;2===d.type?i=new N(n,n.nextSibling,this,t):1===d.type?i=new d.ctor(n,d.name,d.strings,this,t):6===d.type&&(i=new L(n,this,t)),this.v.push(i),d=e[++r];}h!==(null==d?void 0:d.index)&&(n=A.nextNode(),h++);}return o}m(t){let i=0;for(const s of this.v)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,i),i+=s.strings.length-2):s._$AI(t[i])),i++;}}class N{constructor(t,i,s,e){var o;this.type=2,this._$AH=T,this._$AN=void 0,this._$AA=t,this._$AB=i,this._$AM=s,this.options=e,this._$Cg=null===(o=null==e?void 0:e.isConnected)||void 0===o||o;}get _$AU(){var t,i;return null!==(i=null===(t=this._$AM)||void 0===t?void 0:t._$AU)&&void 0!==i?i:this._$Cg}get parentNode(){let t=this._$AA.parentNode;const i=this._$AM;return void 0!==i&&11===t.nodeType&&(t=i.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,i=this){t=V(this,t,i),r(t)?t===T||null==t||""===t?(this._$AH!==T&&this._$AR(),this._$AH=T):t!==this._$AH&&t!==b&&this.$(t):void 0!==t._$litType$?this.T(t):void 0!==t.nodeType?this.S(t):u(t)?this.M(t):this.$(t);}A(t,i=this._$AB){return this._$AA.parentNode.insertBefore(t,i)}S(t){this._$AH!==t&&(this._$AR(),this._$AH=this.A(t));}$(t){this._$AH!==T&&r(this._$AH)?this._$AA.nextSibling.data=t:this.S(l$1.createTextNode(t)),this._$AH=t;}T(t){var i;const{values:s,_$litType$:e}=t,o="number"==typeof e?this._$AC(t):(void 0===e.el&&(e.el=P.createElement(e.h,this.options)),e);if((null===(i=this._$AH)||void 0===i?void 0:i._$AD)===o)this._$AH.m(s);else {const t=new E(o,this),i=t.p(this.options);t.m(s),this.S(i),this._$AH=t;}}_$AC(t){let i=x.get(t.strings);return void 0===i&&x.set(t.strings,i=new P(t)),i}M(t){d(this._$AH)||(this._$AH=[],this._$AR());const i=this._$AH;let s,e=0;for(const o of t)e===i.length?i.push(s=new N(this.A(h()),this.A(h()),this,this.options)):s=i[e],s._$AI(o),e++;e<i.length&&(this._$AR(s&&s._$AB.nextSibling,e),i.length=e);}_$AR(t=this._$AA.nextSibling,i){var s;for(null===(s=this._$AP)||void 0===s||s.call(this,!1,!0,i);t&&t!==this._$AB;){const i=t.nextSibling;t.remove(),t=i;}}setConnected(t){var i;void 0===this._$AM&&(this._$Cg=t,null===(i=this._$AP)||void 0===i||i.call(this,t));}}class S{constructor(t,i,s,e,o){this.type=1,this._$AH=T,this._$AN=void 0,this.element=t,this.name=i,this._$AM=e,this.options=o,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=T;}get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}_$AI(t,i=this,s,e){const o=this.strings;let n=!1;if(void 0===o)t=V(this,t,i,0),n=!r(t)||t!==this._$AH&&t!==b,n&&(this._$AH=t);else {const e=t;let l,h;for(t=o[0],l=0;l<o.length-1;l++)h=V(this,e[s+l],i,l),h===b&&(h=this._$AH[l]),n||(n=!r(h)||h!==this._$AH[l]),h===T?t=T:t!==T&&(t+=(null!=h?h:"")+o[l+1]),this._$AH[l]=h;}n&&!e&&this.k(t);}k(t){t===T?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,null!=t?t:"");}}class M extends S{constructor(){super(...arguments),this.type=3;}k(t){this.element[this.name]=t===T?void 0:t;}}const k=i?i.emptyScript:"";class H extends S{constructor(){super(...arguments),this.type=4;}k(t){t&&t!==T?this.element.setAttribute(this.name,k):this.element.removeAttribute(this.name);}}class I extends S{constructor(t,i,s,e,o){super(t,i,s,e,o),this.type=5;}_$AI(t,i=this){var s;if((t=null!==(s=V(this,t,i,0))&&void 0!==s?s:T)===b)return;const e=this._$AH,o=t===T&&e!==T||t.capture!==e.capture||t.once!==e.once||t.passive!==e.passive,n=t!==T&&(e===T||o);o&&this.element.removeEventListener(this.name,this,e),n&&this.element.addEventListener(this.name,this,t),this._$AH=t;}handleEvent(t){var i,s;"function"==typeof this._$AH?this._$AH.call(null!==(s=null===(i=this.options)||void 0===i?void 0:i.host)&&void 0!==s?s:this.element,t):this._$AH.handleEvent(t);}}class L{constructor(t,i,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=i,this.options=s;}get _$AU(){return this._$AM._$AU}_$AI(t){V(this,t);}}const z=window.litHtmlPolyfillSupport;null==z||z(P,N),(null!==(t=globalThis.litHtmlVersions)&&void 0!==t?t:globalThis.litHtmlVersions=[]).push("2.0.2");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */var l,o;class s extends a$1{constructor(){super(...arguments),this.renderOptions={host:this},this._$Dt=void 0;}createRenderRoot(){var t,e;const i=super.createRenderRoot();return null!==(t=(e=this.renderOptions).renderBefore)&&void 0!==t||(e.renderBefore=i.firstChild),i}update(t){const i=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Dt=w(i,this.renderRoot,this.renderOptions);}connectedCallback(){var t;super.connectedCallback(),null===(t=this._$Dt)||void 0===t||t.setConnected(!0);}disconnectedCallback(){var t;super.disconnectedCallback(),null===(t=this._$Dt)||void 0===t||t.setConnected(!1);}render(){return b}}s.finalized=!0,s._$litElement$=!0,null===(l=globalThis.litElementHydrateSupport)||void 0===l||l.call(globalThis,{LitElement:s});const n=globalThis.litElementPolyfillSupport;null==n||n({LitElement:s});(null!==(o=globalThis.litElementVersions)&&void 0!==o?o:globalThis.litElementVersions=[]).push("3.0.2");

    /**
     * @license
     * Copyright 2017 Google LLC
     * SPDX-License-Identifier: BSD-3-Clause
     */console.warn("The main 'lit-element' module entrypoint is deprecated. Please update your imports to use the 'lit' package: 'lit' and 'lit/decorators.ts' or import from 'lit-element/lit-element.ts'. See https://lit.dev/msg/deprecated-import-path for more information.");

    class NavElement extends s {

        constructor() {
            super();
        }

        // serve per modificare il comportamento di default che crea un elemento
        // all'interno di uno shadows-dom e non permette quindi di condividere 
        // uno stile globale
        createRenderRoot() {
            return this;
        }

    }

    /*!
     * Chart.js v3.6.0
     * https://www.chartjs.org
     * (c) 2021 Chart.js Contributors
     * Released under the MIT License
     */
    const requestAnimFrame = (function() {
      if (typeof window === 'undefined') {
        return function(callback) {
          return callback();
        };
      }
      return window.requestAnimationFrame;
    }());
    function throttled(fn, thisArg, updateFn) {
      const updateArgs = updateFn || ((args) => Array.prototype.slice.call(args));
      let ticking = false;
      let args = [];
      return function(...rest) {
        args = updateArgs(rest);
        if (!ticking) {
          ticking = true;
          requestAnimFrame.call(window, () => {
            ticking = false;
            fn.apply(thisArg, args);
          });
        }
      };
    }
    function debounce(fn, delay) {
      let timeout;
      return function(...args) {
        if (delay) {
          clearTimeout(timeout);
          timeout = setTimeout(fn, delay, args);
        } else {
          fn.apply(this, args);
        }
        return delay;
      };
    }
    const _toLeftRightCenter = (align) => align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
    const _alignStartEnd = (align, start, end) => align === 'start' ? start : align === 'end' ? end : (start + end) / 2;
    const _textX = (align, left, right, rtl) => {
      const check = rtl ? 'left' : 'right';
      return align === check ? right : align === 'center' ? (left + right) / 2 : left;
    };

    function noop() {}
    const uid = (function() {
      let id = 0;
      return function() {
        return id++;
      };
    }());
    function isNullOrUndef(value) {
      return value === null || typeof value === 'undefined';
    }
    function isArray(value) {
      if (Array.isArray && Array.isArray(value)) {
        return true;
      }
      const type = Object.prototype.toString.call(value);
      if (type.substr(0, 7) === '[object' && type.substr(-6) === 'Array]') {
        return true;
      }
      return false;
    }
    function isObject(value) {
      return value !== null && Object.prototype.toString.call(value) === '[object Object]';
    }
    const isNumberFinite = (value) => (typeof value === 'number' || value instanceof Number) && isFinite(+value);
    function finiteOrDefault(value, defaultValue) {
      return isNumberFinite(value) ? value : defaultValue;
    }
    function valueOrDefault(value, defaultValue) {
      return typeof value === 'undefined' ? defaultValue : value;
    }
    const toPercentage = (value, dimension) =>
      typeof value === 'string' && value.endsWith('%') ?
        parseFloat(value) / 100
        : value / dimension;
    const toDimension = (value, dimension) =>
      typeof value === 'string' && value.endsWith('%') ?
        parseFloat(value) / 100 * dimension
        : +value;
    function callback(fn, args, thisArg) {
      if (fn && typeof fn.call === 'function') {
        return fn.apply(thisArg, args);
      }
    }
    function each(loopable, fn, thisArg, reverse) {
      let i, len, keys;
      if (isArray(loopable)) {
        len = loopable.length;
        if (reverse) {
          for (i = len - 1; i >= 0; i--) {
            fn.call(thisArg, loopable[i], i);
          }
        } else {
          for (i = 0; i < len; i++) {
            fn.call(thisArg, loopable[i], i);
          }
        }
      } else if (isObject(loopable)) {
        keys = Object.keys(loopable);
        len = keys.length;
        for (i = 0; i < len; i++) {
          fn.call(thisArg, loopable[keys[i]], keys[i]);
        }
      }
    }
    function _elementsEqual(a0, a1) {
      let i, ilen, v0, v1;
      if (!a0 || !a1 || a0.length !== a1.length) {
        return false;
      }
      for (i = 0, ilen = a0.length; i < ilen; ++i) {
        v0 = a0[i];
        v1 = a1[i];
        if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
          return false;
        }
      }
      return true;
    }
    function clone$1(source) {
      if (isArray(source)) {
        return source.map(clone$1);
      }
      if (isObject(source)) {
        const target = Object.create(null);
        const keys = Object.keys(source);
        const klen = keys.length;
        let k = 0;
        for (; k < klen; ++k) {
          target[keys[k]] = clone$1(source[keys[k]]);
        }
        return target;
      }
      return source;
    }
    function isValidKey(key) {
      return ['__proto__', 'prototype', 'constructor'].indexOf(key) === -1;
    }
    function _merger(key, target, source, options) {
      if (!isValidKey(key)) {
        return;
      }
      const tval = target[key];
      const sval = source[key];
      if (isObject(tval) && isObject(sval)) {
        merge(tval, sval, options);
      } else {
        target[key] = clone$1(sval);
      }
    }
    function merge(target, source, options) {
      const sources = isArray(source) ? source : [source];
      const ilen = sources.length;
      if (!isObject(target)) {
        return target;
      }
      options = options || {};
      const merger = options.merger || _merger;
      for (let i = 0; i < ilen; ++i) {
        source = sources[i];
        if (!isObject(source)) {
          continue;
        }
        const keys = Object.keys(source);
        for (let k = 0, klen = keys.length; k < klen; ++k) {
          merger(keys[k], target, source, options);
        }
      }
      return target;
    }
    function mergeIf(target, source) {
      return merge(target, source, {merger: _mergerIf});
    }
    function _mergerIf(key, target, source) {
      if (!isValidKey(key)) {
        return;
      }
      const tval = target[key];
      const sval = source[key];
      if (isObject(tval) && isObject(sval)) {
        mergeIf(tval, sval);
      } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
        target[key] = clone$1(sval);
      }
    }
    const emptyString = '';
    const dot = '.';
    function indexOfDotOrLength(key, start) {
      const idx = key.indexOf(dot, start);
      return idx === -1 ? key.length : idx;
    }
    function resolveObjectKey(obj, key) {
      if (key === emptyString) {
        return obj;
      }
      let pos = 0;
      let idx = indexOfDotOrLength(key, pos);
      while (obj && idx > pos) {
        obj = obj[key.substr(pos, idx - pos)];
        pos = idx + 1;
        idx = indexOfDotOrLength(key, pos);
      }
      return obj;
    }
    function _capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
    const defined = (value) => typeof value !== 'undefined';
    const isFunction = (value) => typeof value === 'function';
    const setsEqual = (a, b) => {
      if (a.size !== b.size) {
        return false;
      }
      for (const item of a) {
        if (!b.has(item)) {
          return false;
        }
      }
      return true;
    };

    const PI = Math.PI;
    const TAU = 2 * PI;
    const PITAU = TAU + PI;
    const INFINITY = Number.POSITIVE_INFINITY;
    const RAD_PER_DEG = PI / 180;
    const HALF_PI = PI / 2;
    const QUARTER_PI = PI / 4;
    const TWO_THIRDS_PI = PI * 2 / 3;
    const log10 = Math.log10;
    const sign = Math.sign;
    function niceNum(range) {
      const roundedRange = Math.round(range);
      range = almostEquals(range, roundedRange, range / 1000) ? roundedRange : range;
      const niceRange = Math.pow(10, Math.floor(log10(range)));
      const fraction = range / niceRange;
      const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
      return niceFraction * niceRange;
    }
    function _factorize(value) {
      const result = [];
      const sqrt = Math.sqrt(value);
      let i;
      for (i = 1; i < sqrt; i++) {
        if (value % i === 0) {
          result.push(i);
          result.push(value / i);
        }
      }
      if (sqrt === (sqrt | 0)) {
        result.push(sqrt);
      }
      result.sort((a, b) => a - b).pop();
      return result;
    }
    function isNumber(n) {
      return !isNaN(parseFloat(n)) && isFinite(n);
    }
    function almostEquals(x, y, epsilon) {
      return Math.abs(x - y) < epsilon;
    }
    function almostWhole(x, epsilon) {
      const rounded = Math.round(x);
      return ((rounded - epsilon) <= x) && ((rounded + epsilon) >= x);
    }
    function _setMinAndMaxByKey(array, target, property) {
      let i, ilen, value;
      for (i = 0, ilen = array.length; i < ilen; i++) {
        value = array[i][property];
        if (!isNaN(value)) {
          target.min = Math.min(target.min, value);
          target.max = Math.max(target.max, value);
        }
      }
    }
    function toRadians(degrees) {
      return degrees * (PI / 180);
    }
    function toDegrees(radians) {
      return radians * (180 / PI);
    }
    function _decimalPlaces(x) {
      if (!isNumberFinite(x)) {
        return;
      }
      let e = 1;
      let p = 0;
      while (Math.round(x * e) / e !== x) {
        e *= 10;
        p++;
      }
      return p;
    }
    function getAngleFromPoint(centrePoint, anglePoint) {
      const distanceFromXCenter = anglePoint.x - centrePoint.x;
      const distanceFromYCenter = anglePoint.y - centrePoint.y;
      const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
      let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
      if (angle < (-0.5 * PI)) {
        angle += TAU;
      }
      return {
        angle,
        distance: radialDistanceFromCenter
      };
    }
    function distanceBetweenPoints(pt1, pt2) {
      return Math.sqrt(Math.pow(pt2.x - pt1.x, 2) + Math.pow(pt2.y - pt1.y, 2));
    }
    function _angleDiff(a, b) {
      return (a - b + PITAU) % TAU - PI;
    }
    function _normalizeAngle(a) {
      return (a % TAU + TAU) % TAU;
    }
    function _angleBetween(angle, start, end, sameAngleIsFullCircle) {
      const a = _normalizeAngle(angle);
      const s = _normalizeAngle(start);
      const e = _normalizeAngle(end);
      const angleToStart = _normalizeAngle(s - a);
      const angleToEnd = _normalizeAngle(e - a);
      const startToAngle = _normalizeAngle(a - s);
      const endToAngle = _normalizeAngle(a - e);
      return a === s || a === e || (sameAngleIsFullCircle && s === e)
        || (angleToStart > angleToEnd && startToAngle < endToAngle);
    }
    function _limitValue(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }
    function _int16Range(value) {
      return _limitValue(value, -32768, 32767);
    }

    const atEdge = (t) => t === 0 || t === 1;
    const elasticIn = (t, s, p) => -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
    const elasticOut = (t, s, p) => Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
    const effects = {
      linear: t => t,
      easeInQuad: t => t * t,
      easeOutQuad: t => -t * (t - 2),
      easeInOutQuad: t => ((t /= 0.5) < 1)
        ? 0.5 * t * t
        : -0.5 * ((--t) * (t - 2) - 1),
      easeInCubic: t => t * t * t,
      easeOutCubic: t => (t -= 1) * t * t + 1,
      easeInOutCubic: t => ((t /= 0.5) < 1)
        ? 0.5 * t * t * t
        : 0.5 * ((t -= 2) * t * t + 2),
      easeInQuart: t => t * t * t * t,
      easeOutQuart: t => -((t -= 1) * t * t * t - 1),
      easeInOutQuart: t => ((t /= 0.5) < 1)
        ? 0.5 * t * t * t * t
        : -0.5 * ((t -= 2) * t * t * t - 2),
      easeInQuint: t => t * t * t * t * t,
      easeOutQuint: t => (t -= 1) * t * t * t * t + 1,
      easeInOutQuint: t => ((t /= 0.5) < 1)
        ? 0.5 * t * t * t * t * t
        : 0.5 * ((t -= 2) * t * t * t * t + 2),
      easeInSine: t => -Math.cos(t * HALF_PI) + 1,
      easeOutSine: t => Math.sin(t * HALF_PI),
      easeInOutSine: t => -0.5 * (Math.cos(PI * t) - 1),
      easeInExpo: t => (t === 0) ? 0 : Math.pow(2, 10 * (t - 1)),
      easeOutExpo: t => (t === 1) ? 1 : -Math.pow(2, -10 * t) + 1,
      easeInOutExpo: t => atEdge(t) ? t : t < 0.5
        ? 0.5 * Math.pow(2, 10 * (t * 2 - 1))
        : 0.5 * (-Math.pow(2, -10 * (t * 2 - 1)) + 2),
      easeInCirc: t => (t >= 1) ? t : -(Math.sqrt(1 - t * t) - 1),
      easeOutCirc: t => Math.sqrt(1 - (t -= 1) * t),
      easeInOutCirc: t => ((t /= 0.5) < 1)
        ? -0.5 * (Math.sqrt(1 - t * t) - 1)
        : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
      easeInElastic: t => atEdge(t) ? t : elasticIn(t, 0.075, 0.3),
      easeOutElastic: t => atEdge(t) ? t : elasticOut(t, 0.075, 0.3),
      easeInOutElastic(t) {
        const s = 0.1125;
        const p = 0.45;
        return atEdge(t) ? t :
          t < 0.5
            ? 0.5 * elasticIn(t * 2, s, p)
            : 0.5 + 0.5 * elasticOut(t * 2 - 1, s, p);
      },
      easeInBack(t) {
        const s = 1.70158;
        return t * t * ((s + 1) * t - s);
      },
      easeOutBack(t) {
        const s = 1.70158;
        return (t -= 1) * t * ((s + 1) * t + s) + 1;
      },
      easeInOutBack(t) {
        let s = 1.70158;
        if ((t /= 0.5) < 1) {
          return 0.5 * (t * t * (((s *= (1.525)) + 1) * t - s));
        }
        return 0.5 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
      },
      easeInBounce: t => 1 - effects.easeOutBounce(1 - t),
      easeOutBounce(t) {
        const m = 7.5625;
        const d = 2.75;
        if (t < (1 / d)) {
          return m * t * t;
        }
        if (t < (2 / d)) {
          return m * (t -= (1.5 / d)) * t + 0.75;
        }
        if (t < (2.5 / d)) {
          return m * (t -= (2.25 / d)) * t + 0.9375;
        }
        return m * (t -= (2.625 / d)) * t + 0.984375;
      },
      easeInOutBounce: t => (t < 0.5)
        ? effects.easeInBounce(t * 2) * 0.5
        : effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5,
    };

    /*!
     * @kurkle/color v0.1.9
     * https://github.com/kurkle/color#readme
     * (c) 2020 Jukka Kurkela
     * Released under the MIT License
     */
    const map$1 = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, a: 10, b: 11, c: 12, d: 13, e: 14, f: 15};
    const hex = '0123456789ABCDEF';
    const h1 = (b) => hex[b & 0xF];
    const h2 = (b) => hex[(b & 0xF0) >> 4] + hex[b & 0xF];
    const eq = (b) => (((b & 0xF0) >> 4) === (b & 0xF));
    function isShort(v) {
    	return eq(v.r) && eq(v.g) && eq(v.b) && eq(v.a);
    }
    function hexParse(str) {
    	var len = str.length;
    	var ret;
    	if (str[0] === '#') {
    		if (len === 4 || len === 5) {
    			ret = {
    				r: 255 & map$1[str[1]] * 17,
    				g: 255 & map$1[str[2]] * 17,
    				b: 255 & map$1[str[3]] * 17,
    				a: len === 5 ? map$1[str[4]] * 17 : 255
    			};
    		} else if (len === 7 || len === 9) {
    			ret = {
    				r: map$1[str[1]] << 4 | map$1[str[2]],
    				g: map$1[str[3]] << 4 | map$1[str[4]],
    				b: map$1[str[5]] << 4 | map$1[str[6]],
    				a: len === 9 ? (map$1[str[7]] << 4 | map$1[str[8]]) : 255
    			};
    		}
    	}
    	return ret;
    }
    function hexString(v) {
    	var f = isShort(v) ? h1 : h2;
    	return v
    		? '#' + f(v.r) + f(v.g) + f(v.b) + (v.a < 255 ? f(v.a) : '')
    		: v;
    }
    function round(v) {
    	return v + 0.5 | 0;
    }
    const lim = (v, l, h) => Math.max(Math.min(v, h), l);
    function p2b(v) {
    	return lim(round(v * 2.55), 0, 255);
    }
    function n2b(v) {
    	return lim(round(v * 255), 0, 255);
    }
    function b2n(v) {
    	return lim(round(v / 2.55) / 100, 0, 1);
    }
    function n2p(v) {
    	return lim(round(v * 100), 0, 100);
    }
    const RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
    function rgbParse(str) {
    	const m = RGB_RE.exec(str);
    	let a = 255;
    	let r, g, b;
    	if (!m) {
    		return;
    	}
    	if (m[7] !== r) {
    		const v = +m[7];
    		a = 255 & (m[8] ? p2b(v) : v * 255);
    	}
    	r = +m[1];
    	g = +m[3];
    	b = +m[5];
    	r = 255 & (m[2] ? p2b(r) : r);
    	g = 255 & (m[4] ? p2b(g) : g);
    	b = 255 & (m[6] ? p2b(b) : b);
    	return {
    		r: r,
    		g: g,
    		b: b,
    		a: a
    	};
    }
    function rgbString(v) {
    	return v && (
    		v.a < 255
    			? `rgba(${v.r}, ${v.g}, ${v.b}, ${b2n(v.a)})`
    			: `rgb(${v.r}, ${v.g}, ${v.b})`
    	);
    }
    const HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
    function hsl2rgbn(h, s, l) {
    	const a = s * Math.min(l, 1 - l);
    	const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    	return [f(0), f(8), f(4)];
    }
    function hsv2rgbn(h, s, v) {
    	const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
    	return [f(5), f(3), f(1)];
    }
    function hwb2rgbn(h, w, b) {
    	const rgb = hsl2rgbn(h, 1, 0.5);
    	let i;
    	if (w + b > 1) {
    		i = 1 / (w + b);
    		w *= i;
    		b *= i;
    	}
    	for (i = 0; i < 3; i++) {
    		rgb[i] *= 1 - w - b;
    		rgb[i] += w;
    	}
    	return rgb;
    }
    function rgb2hsl(v) {
    	const range = 255;
    	const r = v.r / range;
    	const g = v.g / range;
    	const b = v.b / range;
    	const max = Math.max(r, g, b);
    	const min = Math.min(r, g, b);
    	const l = (max + min) / 2;
    	let h, s, d;
    	if (max !== min) {
    		d = max - min;
    		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    		h = max === r
    			? ((g - b) / d) + (g < b ? 6 : 0)
    			: max === g
    				? (b - r) / d + 2
    				: (r - g) / d + 4;
    		h = h * 60 + 0.5;
    	}
    	return [h | 0, s || 0, l];
    }
    function calln(f, a, b, c) {
    	return (
    		Array.isArray(a)
    			? f(a[0], a[1], a[2])
    			: f(a, b, c)
    	).map(n2b);
    }
    function hsl2rgb(h, s, l) {
    	return calln(hsl2rgbn, h, s, l);
    }
    function hwb2rgb(h, w, b) {
    	return calln(hwb2rgbn, h, w, b);
    }
    function hsv2rgb(h, s, v) {
    	return calln(hsv2rgbn, h, s, v);
    }
    function hue(h) {
    	return (h % 360 + 360) % 360;
    }
    function hueParse(str) {
    	const m = HUE_RE.exec(str);
    	let a = 255;
    	let v;
    	if (!m) {
    		return;
    	}
    	if (m[5] !== v) {
    		a = m[6] ? p2b(+m[5]) : n2b(+m[5]);
    	}
    	const h = hue(+m[2]);
    	const p1 = +m[3] / 100;
    	const p2 = +m[4] / 100;
    	if (m[1] === 'hwb') {
    		v = hwb2rgb(h, p1, p2);
    	} else if (m[1] === 'hsv') {
    		v = hsv2rgb(h, p1, p2);
    	} else {
    		v = hsl2rgb(h, p1, p2);
    	}
    	return {
    		r: v[0],
    		g: v[1],
    		b: v[2],
    		a: a
    	};
    }
    function rotate(v, deg) {
    	var h = rgb2hsl(v);
    	h[0] = hue(h[0] + deg);
    	h = hsl2rgb(h);
    	v.r = h[0];
    	v.g = h[1];
    	v.b = h[2];
    }
    function hslString(v) {
    	if (!v) {
    		return;
    	}
    	const a = rgb2hsl(v);
    	const h = a[0];
    	const s = n2p(a[1]);
    	const l = n2p(a[2]);
    	return v.a < 255
    		? `hsla(${h}, ${s}%, ${l}%, ${b2n(v.a)})`
    		: `hsl(${h}, ${s}%, ${l}%)`;
    }
    const map$1$1 = {
    	x: 'dark',
    	Z: 'light',
    	Y: 're',
    	X: 'blu',
    	W: 'gr',
    	V: 'medium',
    	U: 'slate',
    	A: 'ee',
    	T: 'ol',
    	S: 'or',
    	B: 'ra',
    	C: 'lateg',
    	D: 'ights',
    	R: 'in',
    	Q: 'turquois',
    	E: 'hi',
    	P: 'ro',
    	O: 'al',
    	N: 'le',
    	M: 'de',
    	L: 'yello',
    	F: 'en',
    	K: 'ch',
    	G: 'arks',
    	H: 'ea',
    	I: 'ightg',
    	J: 'wh'
    };
    const names = {
    	OiceXe: 'f0f8ff',
    	antiquewEte: 'faebd7',
    	aqua: 'ffff',
    	aquamarRe: '7fffd4',
    	azuY: 'f0ffff',
    	beige: 'f5f5dc',
    	bisque: 'ffe4c4',
    	black: '0',
    	blanKedOmond: 'ffebcd',
    	Xe: 'ff',
    	XeviTet: '8a2be2',
    	bPwn: 'a52a2a',
    	burlywood: 'deb887',
    	caMtXe: '5f9ea0',
    	KartYuse: '7fff00',
    	KocTate: 'd2691e',
    	cSO: 'ff7f50',
    	cSnflowerXe: '6495ed',
    	cSnsilk: 'fff8dc',
    	crimson: 'dc143c',
    	cyan: 'ffff',
    	xXe: '8b',
    	xcyan: '8b8b',
    	xgTMnPd: 'b8860b',
    	xWay: 'a9a9a9',
    	xgYF: '6400',
    	xgYy: 'a9a9a9',
    	xkhaki: 'bdb76b',
    	xmagFta: '8b008b',
    	xTivegYF: '556b2f',
    	xSange: 'ff8c00',
    	xScEd: '9932cc',
    	xYd: '8b0000',
    	xsOmon: 'e9967a',
    	xsHgYF: '8fbc8f',
    	xUXe: '483d8b',
    	xUWay: '2f4f4f',
    	xUgYy: '2f4f4f',
    	xQe: 'ced1',
    	xviTet: '9400d3',
    	dAppRk: 'ff1493',
    	dApskyXe: 'bfff',
    	dimWay: '696969',
    	dimgYy: '696969',
    	dodgerXe: '1e90ff',
    	fiYbrick: 'b22222',
    	flSOwEte: 'fffaf0',
    	foYstWAn: '228b22',
    	fuKsia: 'ff00ff',
    	gaRsbSo: 'dcdcdc',
    	ghostwEte: 'f8f8ff',
    	gTd: 'ffd700',
    	gTMnPd: 'daa520',
    	Way: '808080',
    	gYF: '8000',
    	gYFLw: 'adff2f',
    	gYy: '808080',
    	honeyMw: 'f0fff0',
    	hotpRk: 'ff69b4',
    	RdianYd: 'cd5c5c',
    	Rdigo: '4b0082',
    	ivSy: 'fffff0',
    	khaki: 'f0e68c',
    	lavFMr: 'e6e6fa',
    	lavFMrXsh: 'fff0f5',
    	lawngYF: '7cfc00',
    	NmoncEffon: 'fffacd',
    	ZXe: 'add8e6',
    	ZcSO: 'f08080',
    	Zcyan: 'e0ffff',
    	ZgTMnPdLw: 'fafad2',
    	ZWay: 'd3d3d3',
    	ZgYF: '90ee90',
    	ZgYy: 'd3d3d3',
    	ZpRk: 'ffb6c1',
    	ZsOmon: 'ffa07a',
    	ZsHgYF: '20b2aa',
    	ZskyXe: '87cefa',
    	ZUWay: '778899',
    	ZUgYy: '778899',
    	ZstAlXe: 'b0c4de',
    	ZLw: 'ffffe0',
    	lime: 'ff00',
    	limegYF: '32cd32',
    	lRF: 'faf0e6',
    	magFta: 'ff00ff',
    	maPon: '800000',
    	VaquamarRe: '66cdaa',
    	VXe: 'cd',
    	VScEd: 'ba55d3',
    	VpurpN: '9370db',
    	VsHgYF: '3cb371',
    	VUXe: '7b68ee',
    	VsprRggYF: 'fa9a',
    	VQe: '48d1cc',
    	VviTetYd: 'c71585',
    	midnightXe: '191970',
    	mRtcYam: 'f5fffa',
    	mistyPse: 'ffe4e1',
    	moccasR: 'ffe4b5',
    	navajowEte: 'ffdead',
    	navy: '80',
    	Tdlace: 'fdf5e6',
    	Tive: '808000',
    	TivedBb: '6b8e23',
    	Sange: 'ffa500',
    	SangeYd: 'ff4500',
    	ScEd: 'da70d6',
    	pOegTMnPd: 'eee8aa',
    	pOegYF: '98fb98',
    	pOeQe: 'afeeee',
    	pOeviTetYd: 'db7093',
    	papayawEp: 'ffefd5',
    	pHKpuff: 'ffdab9',
    	peru: 'cd853f',
    	pRk: 'ffc0cb',
    	plum: 'dda0dd',
    	powMrXe: 'b0e0e6',
    	purpN: '800080',
    	YbeccapurpN: '663399',
    	Yd: 'ff0000',
    	Psybrown: 'bc8f8f',
    	PyOXe: '4169e1',
    	saddNbPwn: '8b4513',
    	sOmon: 'fa8072',
    	sandybPwn: 'f4a460',
    	sHgYF: '2e8b57',
    	sHshell: 'fff5ee',
    	siFna: 'a0522d',
    	silver: 'c0c0c0',
    	skyXe: '87ceeb',
    	UXe: '6a5acd',
    	UWay: '708090',
    	UgYy: '708090',
    	snow: 'fffafa',
    	sprRggYF: 'ff7f',
    	stAlXe: '4682b4',
    	tan: 'd2b48c',
    	teO: '8080',
    	tEstN: 'd8bfd8',
    	tomato: 'ff6347',
    	Qe: '40e0d0',
    	viTet: 'ee82ee',
    	JHt: 'f5deb3',
    	wEte: 'ffffff',
    	wEtesmoke: 'f5f5f5',
    	Lw: 'ffff00',
    	LwgYF: '9acd32'
    };
    function unpack() {
    	const unpacked = {};
    	const keys = Object.keys(names);
    	const tkeys = Object.keys(map$1$1);
    	let i, j, k, ok, nk;
    	for (i = 0; i < keys.length; i++) {
    		ok = nk = keys[i];
    		for (j = 0; j < tkeys.length; j++) {
    			k = tkeys[j];
    			nk = nk.replace(k, map$1$1[k]);
    		}
    		k = parseInt(names[ok], 16);
    		unpacked[nk] = [k >> 16 & 0xFF, k >> 8 & 0xFF, k & 0xFF];
    	}
    	return unpacked;
    }
    let names$1;
    function nameParse(str) {
    	if (!names$1) {
    		names$1 = unpack();
    		names$1.transparent = [0, 0, 0, 0];
    	}
    	const a = names$1[str.toLowerCase()];
    	return a && {
    		r: a[0],
    		g: a[1],
    		b: a[2],
    		a: a.length === 4 ? a[3] : 255
    	};
    }
    function modHSL(v, i, ratio) {
    	if (v) {
    		let tmp = rgb2hsl(v);
    		tmp[i] = Math.max(0, Math.min(tmp[i] + tmp[i] * ratio, i === 0 ? 360 : 1));
    		tmp = hsl2rgb(tmp);
    		v.r = tmp[0];
    		v.g = tmp[1];
    		v.b = tmp[2];
    	}
    }
    function clone(v, proto) {
    	return v ? Object.assign(proto || {}, v) : v;
    }
    function fromObject(input) {
    	var v = {r: 0, g: 0, b: 0, a: 255};
    	if (Array.isArray(input)) {
    		if (input.length >= 3) {
    			v = {r: input[0], g: input[1], b: input[2], a: 255};
    			if (input.length > 3) {
    				v.a = n2b(input[3]);
    			}
    		}
    	} else {
    		v = clone(input, {r: 0, g: 0, b: 0, a: 1});
    		v.a = n2b(v.a);
    	}
    	return v;
    }
    function functionParse(str) {
    	if (str.charAt(0) === 'r') {
    		return rgbParse(str);
    	}
    	return hueParse(str);
    }
    class Color {
    	constructor(input) {
    		if (input instanceof Color) {
    			return input;
    		}
    		const type = typeof input;
    		let v;
    		if (type === 'object') {
    			v = fromObject(input);
    		} else if (type === 'string') {
    			v = hexParse(input) || nameParse(input) || functionParse(input);
    		}
    		this._rgb = v;
    		this._valid = !!v;
    	}
    	get valid() {
    		return this._valid;
    	}
    	get rgb() {
    		var v = clone(this._rgb);
    		if (v) {
    			v.a = b2n(v.a);
    		}
    		return v;
    	}
    	set rgb(obj) {
    		this._rgb = fromObject(obj);
    	}
    	rgbString() {
    		return this._valid ? rgbString(this._rgb) : this._rgb;
    	}
    	hexString() {
    		return this._valid ? hexString(this._rgb) : this._rgb;
    	}
    	hslString() {
    		return this._valid ? hslString(this._rgb) : this._rgb;
    	}
    	mix(color, weight) {
    		const me = this;
    		if (color) {
    			const c1 = me.rgb;
    			const c2 = color.rgb;
    			let w2;
    			const p = weight === w2 ? 0.5 : weight;
    			const w = 2 * p - 1;
    			const a = c1.a - c2.a;
    			const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
    			w2 = 1 - w1;
    			c1.r = 0xFF & w1 * c1.r + w2 * c2.r + 0.5;
    			c1.g = 0xFF & w1 * c1.g + w2 * c2.g + 0.5;
    			c1.b = 0xFF & w1 * c1.b + w2 * c2.b + 0.5;
    			c1.a = p * c1.a + (1 - p) * c2.a;
    			me.rgb = c1;
    		}
    		return me;
    	}
    	clone() {
    		return new Color(this.rgb);
    	}
    	alpha(a) {
    		this._rgb.a = n2b(a);
    		return this;
    	}
    	clearer(ratio) {
    		const rgb = this._rgb;
    		rgb.a *= 1 - ratio;
    		return this;
    	}
    	greyscale() {
    		const rgb = this._rgb;
    		const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
    		rgb.r = rgb.g = rgb.b = val;
    		return this;
    	}
    	opaquer(ratio) {
    		const rgb = this._rgb;
    		rgb.a *= 1 + ratio;
    		return this;
    	}
    	negate() {
    		const v = this._rgb;
    		v.r = 255 - v.r;
    		v.g = 255 - v.g;
    		v.b = 255 - v.b;
    		return this;
    	}
    	lighten(ratio) {
    		modHSL(this._rgb, 2, ratio);
    		return this;
    	}
    	darken(ratio) {
    		modHSL(this._rgb, 2, -ratio);
    		return this;
    	}
    	saturate(ratio) {
    		modHSL(this._rgb, 1, ratio);
    		return this;
    	}
    	desaturate(ratio) {
    		modHSL(this._rgb, 1, -ratio);
    		return this;
    	}
    	rotate(deg) {
    		rotate(this._rgb, deg);
    		return this;
    	}
    }
    function index_esm(input) {
    	return new Color(input);
    }

    const isPatternOrGradient = (value) => value instanceof CanvasGradient || value instanceof CanvasPattern;
    function color(value) {
      return isPatternOrGradient(value) ? value : index_esm(value);
    }
    function getHoverColor(value) {
      return isPatternOrGradient(value)
        ? value
        : index_esm(value).saturate(0.5).darken(0.1).hexString();
    }

    const overrides = Object.create(null);
    const descriptors = Object.create(null);
    function getScope$1(node, key) {
      if (!key) {
        return node;
      }
      const keys = key.split('.');
      for (let i = 0, n = keys.length; i < n; ++i) {
        const k = keys[i];
        node = node[k] || (node[k] = Object.create(null));
      }
      return node;
    }
    function set(root, scope, values) {
      if (typeof scope === 'string') {
        return merge(getScope$1(root, scope), values);
      }
      return merge(getScope$1(root, ''), scope);
    }
    class Defaults {
      constructor(_descriptors) {
        this.animation = undefined;
        this.backgroundColor = 'rgba(0,0,0,0.1)';
        this.borderColor = 'rgba(0,0,0,0.1)';
        this.color = '#666';
        this.datasets = {};
        this.devicePixelRatio = (context) => context.chart.platform.getDevicePixelRatio();
        this.elements = {};
        this.events = [
          'mousemove',
          'mouseout',
          'click',
          'touchstart',
          'touchmove'
        ];
        this.font = {
          family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
          size: 12,
          style: 'normal',
          lineHeight: 1.2,
          weight: null
        };
        this.hover = {};
        this.hoverBackgroundColor = (ctx, options) => getHoverColor(options.backgroundColor);
        this.hoverBorderColor = (ctx, options) => getHoverColor(options.borderColor);
        this.hoverColor = (ctx, options) => getHoverColor(options.color);
        this.indexAxis = 'x';
        this.interaction = {
          mode: 'nearest',
          intersect: true
        };
        this.maintainAspectRatio = true;
        this.onHover = null;
        this.onClick = null;
        this.parsing = true;
        this.plugins = {};
        this.responsive = true;
        this.scale = undefined;
        this.scales = {};
        this.showLine = true;
        this.describe(_descriptors);
      }
      set(scope, values) {
        return set(this, scope, values);
      }
      get(scope) {
        return getScope$1(this, scope);
      }
      describe(scope, values) {
        return set(descriptors, scope, values);
      }
      override(scope, values) {
        return set(overrides, scope, values);
      }
      route(scope, name, targetScope, targetName) {
        const scopeObject = getScope$1(this, scope);
        const targetScopeObject = getScope$1(this, targetScope);
        const privateName = '_' + name;
        Object.defineProperties(scopeObject, {
          [privateName]: {
            value: scopeObject[name],
            writable: true
          },
          [name]: {
            enumerable: true,
            get() {
              const local = this[privateName];
              const target = targetScopeObject[targetName];
              if (isObject(local)) {
                return Object.assign({}, target, local);
              }
              return valueOrDefault(local, target);
            },
            set(value) {
              this[privateName] = value;
            }
          }
        });
      }
    }
    var defaults = new Defaults({
      _scriptable: (name) => !name.startsWith('on'),
      _indexable: (name) => name !== 'events',
      hover: {
        _fallback: 'interaction'
      },
      interaction: {
        _scriptable: false,
        _indexable: false,
      }
    });

    function toFontString(font) {
      if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
        return null;
      }
      return (font.style ? font.style + ' ' : '')
    		+ (font.weight ? font.weight + ' ' : '')
    		+ font.size + 'px '
    		+ font.family;
    }
    function _measureText(ctx, data, gc, longest, string) {
      let textWidth = data[string];
      if (!textWidth) {
        textWidth = data[string] = ctx.measureText(string).width;
        gc.push(string);
      }
      if (textWidth > longest) {
        longest = textWidth;
      }
      return longest;
    }
    function _longestText(ctx, font, arrayOfThings, cache) {
      cache = cache || {};
      let data = cache.data = cache.data || {};
      let gc = cache.garbageCollect = cache.garbageCollect || [];
      if (cache.font !== font) {
        data = cache.data = {};
        gc = cache.garbageCollect = [];
        cache.font = font;
      }
      ctx.save();
      ctx.font = font;
      let longest = 0;
      const ilen = arrayOfThings.length;
      let i, j, jlen, thing, nestedThing;
      for (i = 0; i < ilen; i++) {
        thing = arrayOfThings[i];
        if (thing !== undefined && thing !== null && isArray(thing) !== true) {
          longest = _measureText(ctx, data, gc, longest, thing);
        } else if (isArray(thing)) {
          for (j = 0, jlen = thing.length; j < jlen; j++) {
            nestedThing = thing[j];
            if (nestedThing !== undefined && nestedThing !== null && !isArray(nestedThing)) {
              longest = _measureText(ctx, data, gc, longest, nestedThing);
            }
          }
        }
      }
      ctx.restore();
      const gcLen = gc.length / 2;
      if (gcLen > arrayOfThings.length) {
        for (i = 0; i < gcLen; i++) {
          delete data[gc[i]];
        }
        gc.splice(0, gcLen);
      }
      return longest;
    }
    function _alignPixel(chart, pixel, width) {
      const devicePixelRatio = chart.currentDevicePixelRatio;
      const halfWidth = width !== 0 ? Math.max(width / 2, 0.5) : 0;
      return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
    }
    function clearCanvas(canvas, ctx) {
      ctx = ctx || canvas.getContext('2d');
      ctx.save();
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    function drawPoint(ctx, options, x, y) {
      let type, xOffset, yOffset, size, cornerRadius;
      const style = options.pointStyle;
      const rotation = options.rotation;
      const radius = options.radius;
      let rad = (rotation || 0) * RAD_PER_DEG;
      if (style && typeof style === 'object') {
        type = style.toString();
        if (type === '[object HTMLImageElement]' || type === '[object HTMLCanvasElement]') {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(rad);
          ctx.drawImage(style, -style.width / 2, -style.height / 2, style.width, style.height);
          ctx.restore();
          return;
        }
      }
      if (isNaN(radius) || radius <= 0) {
        return;
      }
      ctx.beginPath();
      switch (style) {
      default:
        ctx.arc(x, y, radius, 0, TAU);
        ctx.closePath();
        break;
      case 'triangle':
        ctx.moveTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        rad += TWO_THIRDS_PI;
        ctx.lineTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        rad += TWO_THIRDS_PI;
        ctx.lineTo(x + Math.sin(rad) * radius, y - Math.cos(rad) * radius);
        ctx.closePath();
        break;
      case 'rectRounded':
        cornerRadius = radius * 0.516;
        size = radius - cornerRadius;
        xOffset = Math.cos(rad + QUARTER_PI) * size;
        yOffset = Math.sin(rad + QUARTER_PI) * size;
        ctx.arc(x - xOffset, y - yOffset, cornerRadius, rad - PI, rad - HALF_PI);
        ctx.arc(x + yOffset, y - xOffset, cornerRadius, rad - HALF_PI, rad);
        ctx.arc(x + xOffset, y + yOffset, cornerRadius, rad, rad + HALF_PI);
        ctx.arc(x - yOffset, y + xOffset, cornerRadius, rad + HALF_PI, rad + PI);
        ctx.closePath();
        break;
      case 'rect':
        if (!rotation) {
          size = Math.SQRT1_2 * radius;
          ctx.rect(x - size, y - size, 2 * size, 2 * size);
          break;
        }
        rad += QUARTER_PI;
      case 'rectRot':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + yOffset, y - xOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        ctx.closePath();
        break;
      case 'crossRot':
        rad += QUARTER_PI;
      case 'cross':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        break;
      case 'star':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        rad += QUARTER_PI;
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        ctx.moveTo(x + yOffset, y - xOffset);
        ctx.lineTo(x - yOffset, y + xOffset);
        break;
      case 'line':
        xOffset = Math.cos(rad) * radius;
        yOffset = Math.sin(rad) * radius;
        ctx.moveTo(x - xOffset, y - yOffset);
        ctx.lineTo(x + xOffset, y + yOffset);
        break;
      case 'dash':
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(rad) * radius, y + Math.sin(rad) * radius);
        break;
      }
      ctx.fill();
      if (options.borderWidth > 0) {
        ctx.stroke();
      }
    }
    function _isPointInArea(point, area, margin) {
      margin = margin || 0.5;
      return !area || (point && point.x > area.left - margin && point.x < area.right + margin &&
    		point.y > area.top - margin && point.y < area.bottom + margin);
    }
    function clipArea(ctx, area) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
      ctx.clip();
    }
    function unclipArea(ctx) {
      ctx.restore();
    }
    function _steppedLineTo(ctx, previous, target, flip, mode) {
      if (!previous) {
        return ctx.lineTo(target.x, target.y);
      }
      if (mode === 'middle') {
        const midpoint = (previous.x + target.x) / 2.0;
        ctx.lineTo(midpoint, previous.y);
        ctx.lineTo(midpoint, target.y);
      } else if (mode === 'after' !== !!flip) {
        ctx.lineTo(previous.x, target.y);
      } else {
        ctx.lineTo(target.x, previous.y);
      }
      ctx.lineTo(target.x, target.y);
    }
    function _bezierCurveTo(ctx, previous, target, flip) {
      if (!previous) {
        return ctx.lineTo(target.x, target.y);
      }
      ctx.bezierCurveTo(
        flip ? previous.cp1x : previous.cp2x,
        flip ? previous.cp1y : previous.cp2y,
        flip ? target.cp2x : target.cp1x,
        flip ? target.cp2y : target.cp1y,
        target.x,
        target.y);
    }
    function renderText(ctx, text, x, y, font, opts = {}) {
      const lines = isArray(text) ? text : [text];
      const stroke = opts.strokeWidth > 0 && opts.strokeColor !== '';
      let i, line;
      ctx.save();
      ctx.font = font.string;
      setRenderOpts(ctx, opts);
      for (i = 0; i < lines.length; ++i) {
        line = lines[i];
        if (stroke) {
          if (opts.strokeColor) {
            ctx.strokeStyle = opts.strokeColor;
          }
          if (!isNullOrUndef(opts.strokeWidth)) {
            ctx.lineWidth = opts.strokeWidth;
          }
          ctx.strokeText(line, x, y, opts.maxWidth);
        }
        ctx.fillText(line, x, y, opts.maxWidth);
        decorateText(ctx, x, y, line, opts);
        y += font.lineHeight;
      }
      ctx.restore();
    }
    function setRenderOpts(ctx, opts) {
      if (opts.translation) {
        ctx.translate(opts.translation[0], opts.translation[1]);
      }
      if (!isNullOrUndef(opts.rotation)) {
        ctx.rotate(opts.rotation);
      }
      if (opts.color) {
        ctx.fillStyle = opts.color;
      }
      if (opts.textAlign) {
        ctx.textAlign = opts.textAlign;
      }
      if (opts.textBaseline) {
        ctx.textBaseline = opts.textBaseline;
      }
    }
    function decorateText(ctx, x, y, line, opts) {
      if (opts.strikethrough || opts.underline) {
        const metrics = ctx.measureText(line);
        const left = x - metrics.actualBoundingBoxLeft;
        const right = x + metrics.actualBoundingBoxRight;
        const top = y - metrics.actualBoundingBoxAscent;
        const bottom = y + metrics.actualBoundingBoxDescent;
        const yDecoration = opts.strikethrough ? (top + bottom) / 2 : bottom;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.beginPath();
        ctx.lineWidth = opts.decorationWidth || 2;
        ctx.moveTo(left, yDecoration);
        ctx.lineTo(right, yDecoration);
        ctx.stroke();
      }
    }
    function addRoundedRectPath(ctx, rect) {
      const {x, y, w, h, radius} = rect;
      ctx.arc(x + radius.topLeft, y + radius.topLeft, radius.topLeft, -HALF_PI, PI, true);
      ctx.lineTo(x, y + h - radius.bottomLeft);
      ctx.arc(x + radius.bottomLeft, y + h - radius.bottomLeft, radius.bottomLeft, PI, HALF_PI, true);
      ctx.lineTo(x + w - radius.bottomRight, y + h);
      ctx.arc(x + w - radius.bottomRight, y + h - radius.bottomRight, radius.bottomRight, HALF_PI, 0, true);
      ctx.lineTo(x + w, y + radius.topRight);
      ctx.arc(x + w - radius.topRight, y + radius.topRight, radius.topRight, 0, -HALF_PI, true);
      ctx.lineTo(x + radius.topLeft, y);
    }

    const LINE_HEIGHT = new RegExp(/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/);
    const FONT_STYLE = new RegExp(/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/);
    function toLineHeight(value, size) {
      const matches = ('' + value).match(LINE_HEIGHT);
      if (!matches || matches[1] === 'normal') {
        return size * 1.2;
      }
      value = +matches[2];
      switch (matches[3]) {
      case 'px':
        return value;
      case '%':
        value /= 100;
        break;
      }
      return size * value;
    }
    const numberOrZero$1 = v => +v || 0;
    function _readValueToProps(value, props) {
      const ret = {};
      const objProps = isObject(props);
      const keys = objProps ? Object.keys(props) : props;
      const read = isObject(value)
        ? objProps
          ? prop => valueOrDefault(value[prop], value[props[prop]])
          : prop => value[prop]
        : () => value;
      for (const prop of keys) {
        ret[prop] = numberOrZero$1(read(prop));
      }
      return ret;
    }
    function toTRBL(value) {
      return _readValueToProps(value, {top: 'y', right: 'x', bottom: 'y', left: 'x'});
    }
    function toTRBLCorners(value) {
      return _readValueToProps(value, ['topLeft', 'topRight', 'bottomLeft', 'bottomRight']);
    }
    function toPadding(value) {
      const obj = toTRBL(value);
      obj.width = obj.left + obj.right;
      obj.height = obj.top + obj.bottom;
      return obj;
    }
    function toFont(options, fallback) {
      options = options || {};
      fallback = fallback || defaults.font;
      let size = valueOrDefault(options.size, fallback.size);
      if (typeof size === 'string') {
        size = parseInt(size, 10);
      }
      let style = valueOrDefault(options.style, fallback.style);
      if (style && !('' + style).match(FONT_STYLE)) {
        console.warn('Invalid font style specified: "' + style + '"');
        style = '';
      }
      const font = {
        family: valueOrDefault(options.family, fallback.family),
        lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
        size,
        style,
        weight: valueOrDefault(options.weight, fallback.weight),
        string: ''
      };
      font.string = toFontString(font);
      return font;
    }
    function resolve(inputs, context, index, info) {
      let cacheable = true;
      let i, ilen, value;
      for (i = 0, ilen = inputs.length; i < ilen; ++i) {
        value = inputs[i];
        if (value === undefined) {
          continue;
        }
        if (context !== undefined && typeof value === 'function') {
          value = value(context);
          cacheable = false;
        }
        if (index !== undefined && isArray(value)) {
          value = value[index % value.length];
          cacheable = false;
        }
        if (value !== undefined) {
          if (info && !cacheable) {
            info.cacheable = false;
          }
          return value;
        }
      }
    }
    function _addGrace(minmax, grace, beginAtZero) {
      const {min, max} = minmax;
      const change = toDimension(grace, (max - min) / 2);
      const keepZero = (value, add) => beginAtZero && value === 0 ? 0 : value + add;
      return {
        min: keepZero(min, -Math.abs(change)),
        max: keepZero(max, change)
      };
    }
    function createContext(parentContext, context) {
      return Object.assign(Object.create(parentContext), context);
    }

    function _lookup(table, value, cmp) {
      cmp = cmp || ((index) => table[index] < value);
      let hi = table.length - 1;
      let lo = 0;
      let mid;
      while (hi - lo > 1) {
        mid = (lo + hi) >> 1;
        if (cmp(mid)) {
          lo = mid;
        } else {
          hi = mid;
        }
      }
      return {lo, hi};
    }
    const _lookupByKey = (table, key, value) =>
      _lookup(table, value, index => table[index][key] < value);
    const _rlookupByKey = (table, key, value) =>
      _lookup(table, value, index => table[index][key] >= value);
    function _filterBetween(values, min, max) {
      let start = 0;
      let end = values.length;
      while (start < end && values[start] < min) {
        start++;
      }
      while (end > start && values[end - 1] > max) {
        end--;
      }
      return start > 0 || end < values.length
        ? values.slice(start, end)
        : values;
    }
    const arrayEvents = ['push', 'pop', 'shift', 'splice', 'unshift'];
    function listenArrayEvents(array, listener) {
      if (array._chartjs) {
        array._chartjs.listeners.push(listener);
        return;
      }
      Object.defineProperty(array, '_chartjs', {
        configurable: true,
        enumerable: false,
        value: {
          listeners: [listener]
        }
      });
      arrayEvents.forEach((key) => {
        const method = '_onData' + _capitalize(key);
        const base = array[key];
        Object.defineProperty(array, key, {
          configurable: true,
          enumerable: false,
          value(...args) {
            const res = base.apply(this, args);
            array._chartjs.listeners.forEach((object) => {
              if (typeof object[method] === 'function') {
                object[method](...args);
              }
            });
            return res;
          }
        });
      });
    }
    function unlistenArrayEvents(array, listener) {
      const stub = array._chartjs;
      if (!stub) {
        return;
      }
      const listeners = stub.listeners;
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
      if (listeners.length > 0) {
        return;
      }
      arrayEvents.forEach((key) => {
        delete array[key];
      });
      delete array._chartjs;
    }
    function _arrayUnique(items) {
      const set = new Set();
      let i, ilen;
      for (i = 0, ilen = items.length; i < ilen; ++i) {
        set.add(items[i]);
      }
      if (set.size === ilen) {
        return items;
      }
      return Array.from(set);
    }

    function _createResolver(scopes, prefixes = [''], rootScopes = scopes, fallback, getTarget = () => scopes[0]) {
      if (!defined(fallback)) {
        fallback = _resolve('_fallback', scopes);
      }
      const cache = {
        [Symbol.toStringTag]: 'Object',
        _cacheable: true,
        _scopes: scopes,
        _rootScopes: rootScopes,
        _fallback: fallback,
        _getTarget: getTarget,
        override: (scope) => _createResolver([scope, ...scopes], prefixes, rootScopes, fallback),
      };
      return new Proxy(cache, {
        deleteProperty(target, prop) {
          delete target[prop];
          delete target._keys;
          delete scopes[0][prop];
          return true;
        },
        get(target, prop) {
          return _cached(target, prop,
            () => _resolveWithPrefixes(prop, prefixes, scopes, target));
        },
        getOwnPropertyDescriptor(target, prop) {
          return Reflect.getOwnPropertyDescriptor(target._scopes[0], prop);
        },
        getPrototypeOf() {
          return Reflect.getPrototypeOf(scopes[0]);
        },
        has(target, prop) {
          return getKeysFromAllScopes(target).includes(prop);
        },
        ownKeys(target) {
          return getKeysFromAllScopes(target);
        },
        set(target, prop, value) {
          const storage = target._storage || (target._storage = getTarget());
          storage[prop] = value;
          delete target[prop];
          delete target._keys;
          return true;
        }
      });
    }
    function _attachContext(proxy, context, subProxy, descriptorDefaults) {
      const cache = {
        _cacheable: false,
        _proxy: proxy,
        _context: context,
        _subProxy: subProxy,
        _stack: new Set(),
        _descriptors: _descriptors(proxy, descriptorDefaults),
        setContext: (ctx) => _attachContext(proxy, ctx, subProxy, descriptorDefaults),
        override: (scope) => _attachContext(proxy.override(scope), context, subProxy, descriptorDefaults)
      };
      return new Proxy(cache, {
        deleteProperty(target, prop) {
          delete target[prop];
          delete proxy[prop];
          return true;
        },
        get(target, prop, receiver) {
          return _cached(target, prop,
            () => _resolveWithContext(target, prop, receiver));
        },
        getOwnPropertyDescriptor(target, prop) {
          return target._descriptors.allKeys
            ? Reflect.has(proxy, prop) ? {enumerable: true, configurable: true} : undefined
            : Reflect.getOwnPropertyDescriptor(proxy, prop);
        },
        getPrototypeOf() {
          return Reflect.getPrototypeOf(proxy);
        },
        has(target, prop) {
          return Reflect.has(proxy, prop);
        },
        ownKeys() {
          return Reflect.ownKeys(proxy);
        },
        set(target, prop, value) {
          proxy[prop] = value;
          delete target[prop];
          return true;
        }
      });
    }
    function _descriptors(proxy, defaults = {scriptable: true, indexable: true}) {
      const {_scriptable = defaults.scriptable, _indexable = defaults.indexable, _allKeys = defaults.allKeys} = proxy;
      return {
        allKeys: _allKeys,
        scriptable: _scriptable,
        indexable: _indexable,
        isScriptable: isFunction(_scriptable) ? _scriptable : () => _scriptable,
        isIndexable: isFunction(_indexable) ? _indexable : () => _indexable
      };
    }
    const readKey = (prefix, name) => prefix ? prefix + _capitalize(name) : name;
    const needsSubResolver = (prop, value) => isObject(value) && prop !== 'adapters';
    function _cached(target, prop, resolve) {
      if (Object.prototype.hasOwnProperty.call(target, prop)) {
        return target[prop];
      }
      const value = resolve();
      target[prop] = value;
      return value;
    }
    function _resolveWithContext(target, prop, receiver) {
      const {_proxy, _context, _subProxy, _descriptors: descriptors} = target;
      let value = _proxy[prop];
      if (isFunction(value) && descriptors.isScriptable(prop)) {
        value = _resolveScriptable(prop, value, target, receiver);
      }
      if (isArray(value) && value.length) {
        value = _resolveArray(prop, value, target, descriptors.isIndexable);
      }
      if (needsSubResolver(prop, value)) {
        value = _attachContext(value, _context, _subProxy && _subProxy[prop], descriptors);
      }
      return value;
    }
    function _resolveScriptable(prop, value, target, receiver) {
      const {_proxy, _context, _subProxy, _stack} = target;
      if (_stack.has(prop)) {
        throw new Error('Recursion detected: ' + Array.from(_stack).join('->') + '->' + prop);
      }
      _stack.add(prop);
      value = value(_context, _subProxy || receiver);
      _stack.delete(prop);
      if (isObject(value)) {
        value = createSubResolver(_proxy._scopes, _proxy, prop, value);
      }
      return value;
    }
    function _resolveArray(prop, value, target, isIndexable) {
      const {_proxy, _context, _subProxy, _descriptors: descriptors} = target;
      if (defined(_context.index) && isIndexable(prop)) {
        value = value[_context.index % value.length];
      } else if (isObject(value[0])) {
        const arr = value;
        const scopes = _proxy._scopes.filter(s => s !== arr);
        value = [];
        for (const item of arr) {
          const resolver = createSubResolver(scopes, _proxy, prop, item);
          value.push(_attachContext(resolver, _context, _subProxy && _subProxy[prop], descriptors));
        }
      }
      return value;
    }
    function resolveFallback(fallback, prop, value) {
      return isFunction(fallback) ? fallback(prop, value) : fallback;
    }
    const getScope = (key, parent) => key === true ? parent
      : typeof key === 'string' ? resolveObjectKey(parent, key) : undefined;
    function addScopes(set, parentScopes, key, parentFallback) {
      for (const parent of parentScopes) {
        const scope = getScope(key, parent);
        if (scope) {
          set.add(scope);
          const fallback = resolveFallback(scope._fallback, key, scope);
          if (defined(fallback) && fallback !== key && fallback !== parentFallback) {
            return fallback;
          }
        } else if (scope === false && defined(parentFallback) && key !== parentFallback) {
          return null;
        }
      }
      return false;
    }
    function createSubResolver(parentScopes, resolver, prop, value) {
      const rootScopes = resolver._rootScopes;
      const fallback = resolveFallback(resolver._fallback, prop, value);
      const allScopes = [...parentScopes, ...rootScopes];
      const set = new Set();
      set.add(value);
      let key = addScopesFromKey(set, allScopes, prop, fallback || prop);
      if (key === null) {
        return false;
      }
      if (defined(fallback) && fallback !== prop) {
        key = addScopesFromKey(set, allScopes, fallback, key);
        if (key === null) {
          return false;
        }
      }
      return _createResolver(Array.from(set), [''], rootScopes, fallback,
        () => subGetTarget(resolver, prop, value));
    }
    function addScopesFromKey(set, allScopes, key, fallback) {
      while (key) {
        key = addScopes(set, allScopes, key, fallback);
      }
      return key;
    }
    function subGetTarget(resolver, prop, value) {
      const parent = resolver._getTarget();
      if (!(prop in parent)) {
        parent[prop] = {};
      }
      const target = parent[prop];
      if (isArray(target) && isObject(value)) {
        return value;
      }
      return target;
    }
    function _resolveWithPrefixes(prop, prefixes, scopes, proxy) {
      let value;
      for (const prefix of prefixes) {
        value = _resolve(readKey(prefix, prop), scopes);
        if (defined(value)) {
          return needsSubResolver(prop, value)
            ? createSubResolver(scopes, proxy, prop, value)
            : value;
        }
      }
    }
    function _resolve(key, scopes) {
      for (const scope of scopes) {
        if (!scope) {
          continue;
        }
        const value = scope[key];
        if (defined(value)) {
          return value;
        }
      }
    }
    function getKeysFromAllScopes(target) {
      let keys = target._keys;
      if (!keys) {
        keys = target._keys = resolveKeysFromAllScopes(target._scopes);
      }
      return keys;
    }
    function resolveKeysFromAllScopes(scopes) {
      const set = new Set();
      for (const scope of scopes) {
        for (const key of Object.keys(scope).filter(k => !k.startsWith('_'))) {
          set.add(key);
        }
      }
      return Array.from(set);
    }

    const EPSILON = Number.EPSILON || 1e-14;
    const getPoint = (points, i) => i < points.length && !points[i].skip && points[i];
    const getValueAxis = (indexAxis) => indexAxis === 'x' ? 'y' : 'x';
    function splineCurve(firstPoint, middlePoint, afterPoint, t) {
      const previous = firstPoint.skip ? middlePoint : firstPoint;
      const current = middlePoint;
      const next = afterPoint.skip ? middlePoint : afterPoint;
      const d01 = distanceBetweenPoints(current, previous);
      const d12 = distanceBetweenPoints(next, current);
      let s01 = d01 / (d01 + d12);
      let s12 = d12 / (d01 + d12);
      s01 = isNaN(s01) ? 0 : s01;
      s12 = isNaN(s12) ? 0 : s12;
      const fa = t * s01;
      const fb = t * s12;
      return {
        previous: {
          x: current.x - fa * (next.x - previous.x),
          y: current.y - fa * (next.y - previous.y)
        },
        next: {
          x: current.x + fb * (next.x - previous.x),
          y: current.y + fb * (next.y - previous.y)
        }
      };
    }
    function monotoneAdjust(points, deltaK, mK) {
      const pointsLen = points.length;
      let alphaK, betaK, tauK, squaredMagnitude, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for (let i = 0; i < pointsLen - 1; ++i) {
        pointCurrent = pointAfter;
        pointAfter = getPoint(points, i + 1);
        if (!pointCurrent || !pointAfter) {
          continue;
        }
        if (almostEquals(deltaK[i], 0, EPSILON)) {
          mK[i] = mK[i + 1] = 0;
          continue;
        }
        alphaK = mK[i] / deltaK[i];
        betaK = mK[i + 1] / deltaK[i];
        squaredMagnitude = Math.pow(alphaK, 2) + Math.pow(betaK, 2);
        if (squaredMagnitude <= 9) {
          continue;
        }
        tauK = 3 / Math.sqrt(squaredMagnitude);
        mK[i] = alphaK * tauK * deltaK[i];
        mK[i + 1] = betaK * tauK * deltaK[i];
      }
    }
    function monotoneCompute(points, mK, indexAxis = 'x') {
      const valueAxis = getValueAxis(indexAxis);
      const pointsLen = points.length;
      let delta, pointBefore, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for (let i = 0; i < pointsLen; ++i) {
        pointBefore = pointCurrent;
        pointCurrent = pointAfter;
        pointAfter = getPoint(points, i + 1);
        if (!pointCurrent) {
          continue;
        }
        const iPixel = pointCurrent[indexAxis];
        const vPixel = pointCurrent[valueAxis];
        if (pointBefore) {
          delta = (iPixel - pointBefore[indexAxis]) / 3;
          pointCurrent[`cp1${indexAxis}`] = iPixel - delta;
          pointCurrent[`cp1${valueAxis}`] = vPixel - delta * mK[i];
        }
        if (pointAfter) {
          delta = (pointAfter[indexAxis] - iPixel) / 3;
          pointCurrent[`cp2${indexAxis}`] = iPixel + delta;
          pointCurrent[`cp2${valueAxis}`] = vPixel + delta * mK[i];
        }
      }
    }
    function splineCurveMonotone(points, indexAxis = 'x') {
      const valueAxis = getValueAxis(indexAxis);
      const pointsLen = points.length;
      const deltaK = Array(pointsLen).fill(0);
      const mK = Array(pointsLen);
      let i, pointBefore, pointCurrent;
      let pointAfter = getPoint(points, 0);
      for (i = 0; i < pointsLen; ++i) {
        pointBefore = pointCurrent;
        pointCurrent = pointAfter;
        pointAfter = getPoint(points, i + 1);
        if (!pointCurrent) {
          continue;
        }
        if (pointAfter) {
          const slopeDelta = pointAfter[indexAxis] - pointCurrent[indexAxis];
          deltaK[i] = slopeDelta !== 0 ? (pointAfter[valueAxis] - pointCurrent[valueAxis]) / slopeDelta : 0;
        }
        mK[i] = !pointBefore ? deltaK[i]
          : !pointAfter ? deltaK[i - 1]
          : (sign(deltaK[i - 1]) !== sign(deltaK[i])) ? 0
          : (deltaK[i - 1] + deltaK[i]) / 2;
      }
      monotoneAdjust(points, deltaK, mK);
      monotoneCompute(points, mK, indexAxis);
    }
    function capControlPoint(pt, min, max) {
      return Math.max(Math.min(pt, max), min);
    }
    function capBezierPoints(points, area) {
      let i, ilen, point, inArea, inAreaPrev;
      let inAreaNext = _isPointInArea(points[0], area);
      for (i = 0, ilen = points.length; i < ilen; ++i) {
        inAreaPrev = inArea;
        inArea = inAreaNext;
        inAreaNext = i < ilen - 1 && _isPointInArea(points[i + 1], area);
        if (!inArea) {
          continue;
        }
        point = points[i];
        if (inAreaPrev) {
          point.cp1x = capControlPoint(point.cp1x, area.left, area.right);
          point.cp1y = capControlPoint(point.cp1y, area.top, area.bottom);
        }
        if (inAreaNext) {
          point.cp2x = capControlPoint(point.cp2x, area.left, area.right);
          point.cp2y = capControlPoint(point.cp2y, area.top, area.bottom);
        }
      }
    }
    function _updateBezierControlPoints(points, options, area, loop, indexAxis) {
      let i, ilen, point, controlPoints;
      if (options.spanGaps) {
        points = points.filter((pt) => !pt.skip);
      }
      if (options.cubicInterpolationMode === 'monotone') {
        splineCurveMonotone(points, indexAxis);
      } else {
        let prev = loop ? points[points.length - 1] : points[0];
        for (i = 0, ilen = points.length; i < ilen; ++i) {
          point = points[i];
          controlPoints = splineCurve(
            prev,
            point,
            points[Math.min(i + 1, ilen - (loop ? 0 : 1)) % ilen],
            options.tension
          );
          point.cp1x = controlPoints.previous.x;
          point.cp1y = controlPoints.previous.y;
          point.cp2x = controlPoints.next.x;
          point.cp2y = controlPoints.next.y;
          prev = point;
        }
      }
      if (options.capBezierPoints) {
        capBezierPoints(points, area);
      }
    }

    function _isDomSupported() {
      return typeof window !== 'undefined' && typeof document !== 'undefined';
    }
    function _getParentNode(domNode) {
      let parent = domNode.parentNode;
      if (parent && parent.toString() === '[object ShadowRoot]') {
        parent = parent.host;
      }
      return parent;
    }
    function parseMaxStyle(styleValue, node, parentProperty) {
      let valueInPixels;
      if (typeof styleValue === 'string') {
        valueInPixels = parseInt(styleValue, 10);
        if (styleValue.indexOf('%') !== -1) {
          valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
        }
      } else {
        valueInPixels = styleValue;
      }
      return valueInPixels;
    }
    const getComputedStyle = (element) => window.getComputedStyle(element, null);
    function getStyle(el, property) {
      return getComputedStyle(el).getPropertyValue(property);
    }
    const positions = ['top', 'right', 'bottom', 'left'];
    function getPositionedStyle(styles, style, suffix) {
      const result = {};
      suffix = suffix ? '-' + suffix : '';
      for (let i = 0; i < 4; i++) {
        const pos = positions[i];
        result[pos] = parseFloat(styles[style + '-' + pos + suffix]) || 0;
      }
      result.width = result.left + result.right;
      result.height = result.top + result.bottom;
      return result;
    }
    const useOffsetPos = (x, y, target) => (x > 0 || y > 0) && (!target || !target.shadowRoot);
    function getCanvasPosition(evt, canvas) {
      const e = evt.native || evt;
      const touches = e.touches;
      const source = touches && touches.length ? touches[0] : e;
      const {offsetX, offsetY} = source;
      let box = false;
      let x, y;
      if (useOffsetPos(offsetX, offsetY, e.target)) {
        x = offsetX;
        y = offsetY;
      } else {
        const rect = canvas.getBoundingClientRect();
        x = source.clientX - rect.left;
        y = source.clientY - rect.top;
        box = true;
      }
      return {x, y, box};
    }
    function getRelativePosition$1(evt, chart) {
      const {canvas, currentDevicePixelRatio} = chart;
      const style = getComputedStyle(canvas);
      const borderBox = style.boxSizing === 'border-box';
      const paddings = getPositionedStyle(style, 'padding');
      const borders = getPositionedStyle(style, 'border', 'width');
      const {x, y, box} = getCanvasPosition(evt, canvas);
      const xOffset = paddings.left + (box && borders.left);
      const yOffset = paddings.top + (box && borders.top);
      let {width, height} = chart;
      if (borderBox) {
        width -= paddings.width + borders.width;
        height -= paddings.height + borders.height;
      }
      return {
        x: Math.round((x - xOffset) / width * canvas.width / currentDevicePixelRatio),
        y: Math.round((y - yOffset) / height * canvas.height / currentDevicePixelRatio)
      };
    }
    function getContainerSize(canvas, width, height) {
      let maxWidth, maxHeight;
      if (width === undefined || height === undefined) {
        const container = _getParentNode(canvas);
        if (!container) {
          width = canvas.clientWidth;
          height = canvas.clientHeight;
        } else {
          const rect = container.getBoundingClientRect();
          const containerStyle = getComputedStyle(container);
          const containerBorder = getPositionedStyle(containerStyle, 'border', 'width');
          const containerPadding = getPositionedStyle(containerStyle, 'padding');
          width = rect.width - containerPadding.width - containerBorder.width;
          height = rect.height - containerPadding.height - containerBorder.height;
          maxWidth = parseMaxStyle(containerStyle.maxWidth, container, 'clientWidth');
          maxHeight = parseMaxStyle(containerStyle.maxHeight, container, 'clientHeight');
        }
      }
      return {
        width,
        height,
        maxWidth: maxWidth || INFINITY,
        maxHeight: maxHeight || INFINITY
      };
    }
    const round1 = v => Math.round(v * 10) / 10;
    function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
      const style = getComputedStyle(canvas);
      const margins = getPositionedStyle(style, 'margin');
      const maxWidth = parseMaxStyle(style.maxWidth, canvas, 'clientWidth') || INFINITY;
      const maxHeight = parseMaxStyle(style.maxHeight, canvas, 'clientHeight') || INFINITY;
      const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
      let {width, height} = containerSize;
      if (style.boxSizing === 'content-box') {
        const borders = getPositionedStyle(style, 'border', 'width');
        const paddings = getPositionedStyle(style, 'padding');
        width -= paddings.width + borders.width;
        height -= paddings.height + borders.height;
      }
      width = Math.max(0, width - margins.width);
      height = Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height - margins.height);
      width = round1(Math.min(width, maxWidth, containerSize.maxWidth));
      height = round1(Math.min(height, maxHeight, containerSize.maxHeight));
      if (width && !height) {
        height = round1(width / 2);
      }
      return {
        width,
        height
      };
    }
    function retinaScale(chart, forceRatio, forceStyle) {
      const pixelRatio = forceRatio || 1;
      const deviceHeight = Math.floor(chart.height * pixelRatio);
      const deviceWidth = Math.floor(chart.width * pixelRatio);
      chart.height = deviceHeight / pixelRatio;
      chart.width = deviceWidth / pixelRatio;
      const canvas = chart.canvas;
      if (canvas.style && (forceStyle || (!canvas.style.height && !canvas.style.width))) {
        canvas.style.height = `${chart.height}px`;
        canvas.style.width = `${chart.width}px`;
      }
      if (chart.currentDevicePixelRatio !== pixelRatio
          || canvas.height !== deviceHeight
          || canvas.width !== deviceWidth) {
        chart.currentDevicePixelRatio = pixelRatio;
        canvas.height = deviceHeight;
        canvas.width = deviceWidth;
        chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        return true;
      }
      return false;
    }
    const supportsEventListenerOptions = (function() {
      let passiveSupported = false;
      try {
        const options = {
          get passive() {
            passiveSupported = true;
            return false;
          }
        };
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
      } catch (e) {
      }
      return passiveSupported;
    }());
    function readUsedSize(element, property) {
      const value = getStyle(element, property);
      const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
      return matches ? +matches[1] : undefined;
    }

    function _pointInLine(p1, p2, t, mode) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      };
    }
    function _steppedInterpolation(p1, p2, t, mode) {
      return {
        x: p1.x + t * (p2.x - p1.x),
        y: mode === 'middle' ? t < 0.5 ? p1.y : p2.y
        : mode === 'after' ? t < 1 ? p1.y : p2.y
        : t > 0 ? p2.y : p1.y
      };
    }
    function _bezierInterpolation(p1, p2, t, mode) {
      const cp1 = {x: p1.cp2x, y: p1.cp2y};
      const cp2 = {x: p2.cp1x, y: p2.cp1y};
      const a = _pointInLine(p1, cp1, t);
      const b = _pointInLine(cp1, cp2, t);
      const c = _pointInLine(cp2, p2, t);
      const d = _pointInLine(a, b, t);
      const e = _pointInLine(b, c, t);
      return _pointInLine(d, e, t);
    }

    const intlCache = new Map();
    function getNumberFormat(locale, options) {
      options = options || {};
      const cacheKey = locale + JSON.stringify(options);
      let formatter = intlCache.get(cacheKey);
      if (!formatter) {
        formatter = new Intl.NumberFormat(locale, options);
        intlCache.set(cacheKey, formatter);
      }
      return formatter;
    }
    function formatNumber(num, locale, options) {
      return getNumberFormat(locale, options).format(num);
    }

    const getRightToLeftAdapter = function(rectX, width) {
      return {
        x(x) {
          return rectX + rectX + width - x;
        },
        setWidth(w) {
          width = w;
        },
        textAlign(align) {
          if (align === 'center') {
            return align;
          }
          return align === 'right' ? 'left' : 'right';
        },
        xPlus(x, value) {
          return x - value;
        },
        leftForLtr(x, itemWidth) {
          return x - itemWidth;
        },
      };
    };
    const getLeftToRightAdapter = function() {
      return {
        x(x) {
          return x;
        },
        setWidth(w) {
        },
        textAlign(align) {
          return align;
        },
        xPlus(x, value) {
          return x + value;
        },
        leftForLtr(x, _itemWidth) {
          return x;
        },
      };
    };
    function getRtlAdapter(rtl, rectX, width) {
      return rtl ? getRightToLeftAdapter(rectX, width) : getLeftToRightAdapter();
    }
    function overrideTextDirection(ctx, direction) {
      let style, original;
      if (direction === 'ltr' || direction === 'rtl') {
        style = ctx.canvas.style;
        original = [
          style.getPropertyValue('direction'),
          style.getPropertyPriority('direction'),
        ];
        style.setProperty('direction', direction, 'important');
        ctx.prevTextDirection = original;
      }
    }
    function restoreTextDirection(ctx, original) {
      if (original !== undefined) {
        delete ctx.prevTextDirection;
        ctx.canvas.style.setProperty('direction', original[0], original[1]);
      }
    }

    function propertyFn(property) {
      if (property === 'angle') {
        return {
          between: _angleBetween,
          compare: _angleDiff,
          normalize: _normalizeAngle,
        };
      }
      return {
        between: (n, s, e) => n >= Math.min(s, e) && n <= Math.max(e, s),
        compare: (a, b) => a - b,
        normalize: x => x
      };
    }
    function normalizeSegment({start, end, count, loop, style}) {
      return {
        start: start % count,
        end: end % count,
        loop: loop && (end - start + 1) % count === 0,
        style
      };
    }
    function getSegment(segment, points, bounds) {
      const {property, start: startBound, end: endBound} = bounds;
      const {between, normalize} = propertyFn(property);
      const count = points.length;
      let {start, end, loop} = segment;
      let i, ilen;
      if (loop) {
        start += count;
        end += count;
        for (i = 0, ilen = count; i < ilen; ++i) {
          if (!between(normalize(points[start % count][property]), startBound, endBound)) {
            break;
          }
          start--;
          end--;
        }
        start %= count;
        end %= count;
      }
      if (end < start) {
        end += count;
      }
      return {start, end, loop, style: segment.style};
    }
    function _boundSegment(segment, points, bounds) {
      if (!bounds) {
        return [segment];
      }
      const {property, start: startBound, end: endBound} = bounds;
      const count = points.length;
      const {compare, between, normalize} = propertyFn(property);
      const {start, end, loop, style} = getSegment(segment, points, bounds);
      const result = [];
      let inside = false;
      let subStart = null;
      let value, point, prevValue;
      const startIsBefore = () => between(startBound, prevValue, value) && compare(startBound, prevValue) !== 0;
      const endIsBefore = () => compare(endBound, value) === 0 || between(endBound, prevValue, value);
      const shouldStart = () => inside || startIsBefore();
      const shouldStop = () => !inside || endIsBefore();
      for (let i = start, prev = start; i <= end; ++i) {
        point = points[i % count];
        if (point.skip) {
          continue;
        }
        value = normalize(point[property]);
        if (value === prevValue) {
          continue;
        }
        inside = between(value, startBound, endBound);
        if (subStart === null && shouldStart()) {
          subStart = compare(value, startBound) === 0 ? i : prev;
        }
        if (subStart !== null && shouldStop()) {
          result.push(normalizeSegment({start: subStart, end: i, loop, count, style}));
          subStart = null;
        }
        prev = i;
        prevValue = value;
      }
      if (subStart !== null) {
        result.push(normalizeSegment({start: subStart, end, loop, count, style}));
      }
      return result;
    }
    function _boundSegments(line, bounds) {
      const result = [];
      const segments = line.segments;
      for (let i = 0; i < segments.length; i++) {
        const sub = _boundSegment(segments[i], line.points, bounds);
        if (sub.length) {
          result.push(...sub);
        }
      }
      return result;
    }
    function findStartAndEnd(points, count, loop, spanGaps) {
      let start = 0;
      let end = count - 1;
      if (loop && !spanGaps) {
        while (start < count && !points[start].skip) {
          start++;
        }
      }
      while (start < count && points[start].skip) {
        start++;
      }
      start %= count;
      if (loop) {
        end += start;
      }
      while (end > start && points[end % count].skip) {
        end--;
      }
      end %= count;
      return {start, end};
    }
    function solidSegments(points, start, max, loop) {
      const count = points.length;
      const result = [];
      let last = start;
      let prev = points[start];
      let end;
      for (end = start + 1; end <= max; ++end) {
        const cur = points[end % count];
        if (cur.skip || cur.stop) {
          if (!prev.skip) {
            loop = false;
            result.push({start: start % count, end: (end - 1) % count, loop});
            start = last = cur.stop ? end : null;
          }
        } else {
          last = end;
          if (prev.skip) {
            start = end;
          }
        }
        prev = cur;
      }
      if (last !== null) {
        result.push({start: start % count, end: last % count, loop});
      }
      return result;
    }
    function _computeSegments(line, segmentOptions) {
      const points = line.points;
      const spanGaps = line.options.spanGaps;
      const count = points.length;
      if (!count) {
        return [];
      }
      const loop = !!line._loop;
      const {start, end} = findStartAndEnd(points, count, loop, spanGaps);
      if (spanGaps === true) {
        return splitByStyles(line, [{start, end, loop}], points, segmentOptions);
      }
      const max = end < start ? end + count : end;
      const completeLoop = !!line._fullLoop && start === 0 && end === count - 1;
      return splitByStyles(line, solidSegments(points, start, max, completeLoop), points, segmentOptions);
    }
    function splitByStyles(line, segments, points, segmentOptions) {
      if (!segmentOptions || !segmentOptions.setContext || !points) {
        return segments;
      }
      return doSplitByStyles(line, segments, points, segmentOptions);
    }
    function doSplitByStyles(line, segments, points, segmentOptions) {
      const chartContext = line._chart.getContext();
      const baseStyle = readStyle(line.options);
      const {_datasetIndex: datasetIndex, options: {spanGaps}} = line;
      const count = points.length;
      const result = [];
      let prevStyle = baseStyle;
      let start = segments[0].start;
      let i = start;
      function addStyle(s, e, l, st) {
        const dir = spanGaps ? -1 : 1;
        if (s === e) {
          return;
        }
        s += count;
        while (points[s % count].skip) {
          s -= dir;
        }
        while (points[e % count].skip) {
          e += dir;
        }
        if (s % count !== e % count) {
          result.push({start: s % count, end: e % count, loop: l, style: st});
          prevStyle = st;
          start = e % count;
        }
      }
      for (const segment of segments) {
        start = spanGaps ? start : segment.start;
        let prev = points[start % count];
        let style;
        for (i = start + 1; i <= segment.end; i++) {
          const pt = points[i % count];
          style = readStyle(segmentOptions.setContext(createContext(chartContext, {
            type: 'segment',
            p0: prev,
            p1: pt,
            p0DataIndex: (i - 1) % count,
            p1DataIndex: i % count,
            datasetIndex
          })));
          if (styleChanged(style, prevStyle)) {
            addStyle(start, i - 1, segment.loop, prevStyle);
          }
          prev = pt;
          prevStyle = style;
        }
        if (start < i - 1) {
          addStyle(start, i - 1, segment.loop, prevStyle);
        }
      }
      return result;
    }
    function readStyle(options) {
      return {
        backgroundColor: options.backgroundColor,
        borderCapStyle: options.borderCapStyle,
        borderDash: options.borderDash,
        borderDashOffset: options.borderDashOffset,
        borderJoinStyle: options.borderJoinStyle,
        borderWidth: options.borderWidth,
        borderColor: options.borderColor
      };
    }
    function styleChanged(style, prevStyle) {
      return prevStyle && JSON.stringify(style) !== JSON.stringify(prevStyle);
    }

    /*!
     * Chart.js v3.6.0
     * https://www.chartjs.org
     * (c) 2021 Chart.js Contributors
     * Released under the MIT License
     */

    class Animator {
      constructor() {
        this._request = null;
        this._charts = new Map();
        this._running = false;
        this._lastDate = undefined;
      }
      _notify(chart, anims, date, type) {
        const callbacks = anims.listeners[type];
        const numSteps = anims.duration;
        callbacks.forEach(fn => fn({
          chart,
          initial: anims.initial,
          numSteps,
          currentStep: Math.min(date - anims.start, numSteps)
        }));
      }
      _refresh() {
        if (this._request) {
          return;
        }
        this._running = true;
        this._request = requestAnimFrame.call(window, () => {
          this._update();
          this._request = null;
          if (this._running) {
            this._refresh();
          }
        });
      }
      _update(date = Date.now()) {
        let remaining = 0;
        this._charts.forEach((anims, chart) => {
          if (!anims.running || !anims.items.length) {
            return;
          }
          const items = anims.items;
          let i = items.length - 1;
          let draw = false;
          let item;
          for (; i >= 0; --i) {
            item = items[i];
            if (item._active) {
              if (item._total > anims.duration) {
                anims.duration = item._total;
              }
              item.tick(date);
              draw = true;
            } else {
              items[i] = items[items.length - 1];
              items.pop();
            }
          }
          if (draw) {
            chart.draw();
            this._notify(chart, anims, date, 'progress');
          }
          if (!items.length) {
            anims.running = false;
            this._notify(chart, anims, date, 'complete');
            anims.initial = false;
          }
          remaining += items.length;
        });
        this._lastDate = date;
        if (remaining === 0) {
          this._running = false;
        }
      }
      _getAnims(chart) {
        const charts = this._charts;
        let anims = charts.get(chart);
        if (!anims) {
          anims = {
            running: false,
            initial: true,
            items: [],
            listeners: {
              complete: [],
              progress: []
            }
          };
          charts.set(chart, anims);
        }
        return anims;
      }
      listen(chart, event, cb) {
        this._getAnims(chart).listeners[event].push(cb);
      }
      add(chart, items) {
        if (!items || !items.length) {
          return;
        }
        this._getAnims(chart).items.push(...items);
      }
      has(chart) {
        return this._getAnims(chart).items.length > 0;
      }
      start(chart) {
        const anims = this._charts.get(chart);
        if (!anims) {
          return;
        }
        anims.running = true;
        anims.start = Date.now();
        anims.duration = anims.items.reduce((acc, cur) => Math.max(acc, cur._duration), 0);
        this._refresh();
      }
      running(chart) {
        if (!this._running) {
          return false;
        }
        const anims = this._charts.get(chart);
        if (!anims || !anims.running || !anims.items.length) {
          return false;
        }
        return true;
      }
      stop(chart) {
        const anims = this._charts.get(chart);
        if (!anims || !anims.items.length) {
          return;
        }
        const items = anims.items;
        let i = items.length - 1;
        for (; i >= 0; --i) {
          items[i].cancel();
        }
        anims.items = [];
        this._notify(chart, anims, Date.now(), 'complete');
      }
      remove(chart) {
        return this._charts.delete(chart);
      }
    }
    var animator = new Animator();

    const transparent = 'transparent';
    const interpolators = {
      boolean(from, to, factor) {
        return factor > 0.5 ? to : from;
      },
      color(from, to, factor) {
        const c0 = color(from || transparent);
        const c1 = c0.valid && color(to || transparent);
        return c1 && c1.valid
          ? c1.mix(c0, factor).hexString()
          : to;
      },
      number(from, to, factor) {
        return from + (to - from) * factor;
      }
    };
    class Animation {
      constructor(cfg, target, prop, to) {
        const currentValue = target[prop];
        to = resolve([cfg.to, to, currentValue, cfg.from]);
        const from = resolve([cfg.from, currentValue, to]);
        this._active = true;
        this._fn = cfg.fn || interpolators[cfg.type || typeof from];
        this._easing = effects[cfg.easing] || effects.linear;
        this._start = Math.floor(Date.now() + (cfg.delay || 0));
        this._duration = this._total = Math.floor(cfg.duration);
        this._loop = !!cfg.loop;
        this._target = target;
        this._prop = prop;
        this._from = from;
        this._to = to;
        this._promises = undefined;
      }
      active() {
        return this._active;
      }
      update(cfg, to, date) {
        if (this._active) {
          this._notify(false);
          const currentValue = this._target[this._prop];
          const elapsed = date - this._start;
          const remain = this._duration - elapsed;
          this._start = date;
          this._duration = Math.floor(Math.max(remain, cfg.duration));
          this._total += elapsed;
          this._loop = !!cfg.loop;
          this._to = resolve([cfg.to, to, currentValue, cfg.from]);
          this._from = resolve([cfg.from, currentValue, to]);
        }
      }
      cancel() {
        if (this._active) {
          this.tick(Date.now());
          this._active = false;
          this._notify(false);
        }
      }
      tick(date) {
        const elapsed = date - this._start;
        const duration = this._duration;
        const prop = this._prop;
        const from = this._from;
        const loop = this._loop;
        const to = this._to;
        let factor;
        this._active = from !== to && (loop || (elapsed < duration));
        if (!this._active) {
          this._target[prop] = to;
          this._notify(true);
          return;
        }
        if (elapsed < 0) {
          this._target[prop] = from;
          return;
        }
        factor = (elapsed / duration) % 2;
        factor = loop && factor > 1 ? 2 - factor : factor;
        factor = this._easing(Math.min(1, Math.max(0, factor)));
        this._target[prop] = this._fn(from, to, factor);
      }
      wait() {
        const promises = this._promises || (this._promises = []);
        return new Promise((res, rej) => {
          promises.push({res, rej});
        });
      }
      _notify(resolved) {
        const method = resolved ? 'res' : 'rej';
        const promises = this._promises || [];
        for (let i = 0; i < promises.length; i++) {
          promises[i][method]();
        }
      }
    }

    const numbers = ['x', 'y', 'borderWidth', 'radius', 'tension'];
    const colors = ['color', 'borderColor', 'backgroundColor'];
    defaults.set('animation', {
      delay: undefined,
      duration: 1000,
      easing: 'easeOutQuart',
      fn: undefined,
      from: undefined,
      loop: undefined,
      to: undefined,
      type: undefined,
    });
    const animationOptions = Object.keys(defaults.animation);
    defaults.describe('animation', {
      _fallback: false,
      _indexable: false,
      _scriptable: (name) => name !== 'onProgress' && name !== 'onComplete' && name !== 'fn',
    });
    defaults.set('animations', {
      colors: {
        type: 'color',
        properties: colors
      },
      numbers: {
        type: 'number',
        properties: numbers
      },
    });
    defaults.describe('animations', {
      _fallback: 'animation',
    });
    defaults.set('transitions', {
      active: {
        animation: {
          duration: 400
        }
      },
      resize: {
        animation: {
          duration: 0
        }
      },
      show: {
        animations: {
          colors: {
            from: 'transparent'
          },
          visible: {
            type: 'boolean',
            duration: 0
          },
        }
      },
      hide: {
        animations: {
          colors: {
            to: 'transparent'
          },
          visible: {
            type: 'boolean',
            easing: 'linear',
            fn: v => v | 0
          },
        }
      }
    });
    class Animations {
      constructor(chart, config) {
        this._chart = chart;
        this._properties = new Map();
        this.configure(config);
      }
      configure(config) {
        if (!isObject(config)) {
          return;
        }
        const animatedProps = this._properties;
        Object.getOwnPropertyNames(config).forEach(key => {
          const cfg = config[key];
          if (!isObject(cfg)) {
            return;
          }
          const resolved = {};
          for (const option of animationOptions) {
            resolved[option] = cfg[option];
          }
          (isArray(cfg.properties) && cfg.properties || [key]).forEach((prop) => {
            if (prop === key || !animatedProps.has(prop)) {
              animatedProps.set(prop, resolved);
            }
          });
        });
      }
      _animateOptions(target, values) {
        const newOptions = values.options;
        const options = resolveTargetOptions(target, newOptions);
        if (!options) {
          return [];
        }
        const animations = this._createAnimations(options, newOptions);
        if (newOptions.$shared) {
          awaitAll(target.options.$animations, newOptions).then(() => {
            target.options = newOptions;
          }, () => {
          });
        }
        return animations;
      }
      _createAnimations(target, values) {
        const animatedProps = this._properties;
        const animations = [];
        const running = target.$animations || (target.$animations = {});
        const props = Object.keys(values);
        const date = Date.now();
        let i;
        for (i = props.length - 1; i >= 0; --i) {
          const prop = props[i];
          if (prop.charAt(0) === '$') {
            continue;
          }
          if (prop === 'options') {
            animations.push(...this._animateOptions(target, values));
            continue;
          }
          const value = values[prop];
          let animation = running[prop];
          const cfg = animatedProps.get(prop);
          if (animation) {
            if (cfg && animation.active()) {
              animation.update(cfg, value, date);
              continue;
            } else {
              animation.cancel();
            }
          }
          if (!cfg || !cfg.duration) {
            target[prop] = value;
            continue;
          }
          running[prop] = animation = new Animation(cfg, target, prop, value);
          animations.push(animation);
        }
        return animations;
      }
      update(target, values) {
        if (this._properties.size === 0) {
          Object.assign(target, values);
          return;
        }
        const animations = this._createAnimations(target, values);
        if (animations.length) {
          animator.add(this._chart, animations);
          return true;
        }
      }
    }
    function awaitAll(animations, properties) {
      const running = [];
      const keys = Object.keys(properties);
      for (let i = 0; i < keys.length; i++) {
        const anim = animations[keys[i]];
        if (anim && anim.active()) {
          running.push(anim.wait());
        }
      }
      return Promise.all(running);
    }
    function resolveTargetOptions(target, newOptions) {
      if (!newOptions) {
        return;
      }
      let options = target.options;
      if (!options) {
        target.options = newOptions;
        return;
      }
      if (options.$shared) {
        target.options = options = Object.assign({}, options, {$shared: false, $animations: {}});
      }
      return options;
    }

    function scaleClip(scale, allowedOverflow) {
      const opts = scale && scale.options || {};
      const reverse = opts.reverse;
      const min = opts.min === undefined ? allowedOverflow : 0;
      const max = opts.max === undefined ? allowedOverflow : 0;
      return {
        start: reverse ? max : min,
        end: reverse ? min : max
      };
    }
    function defaultClip(xScale, yScale, allowedOverflow) {
      if (allowedOverflow === false) {
        return false;
      }
      const x = scaleClip(xScale, allowedOverflow);
      const y = scaleClip(yScale, allowedOverflow);
      return {
        top: y.end,
        right: x.end,
        bottom: y.start,
        left: x.start
      };
    }
    function toClip(value) {
      let t, r, b, l;
      if (isObject(value)) {
        t = value.top;
        r = value.right;
        b = value.bottom;
        l = value.left;
      } else {
        t = r = b = l = value;
      }
      return {
        top: t,
        right: r,
        bottom: b,
        left: l,
        disabled: value === false
      };
    }
    function getSortedDatasetIndices(chart, filterVisible) {
      const keys = [];
      const metasets = chart._getSortedDatasetMetas(filterVisible);
      let i, ilen;
      for (i = 0, ilen = metasets.length; i < ilen; ++i) {
        keys.push(metasets[i].index);
      }
      return keys;
    }
    function applyStack(stack, value, dsIndex, options = {}) {
      const keys = stack.keys;
      const singleMode = options.mode === 'single';
      let i, ilen, datasetIndex, otherValue;
      if (value === null) {
        return;
      }
      for (i = 0, ilen = keys.length; i < ilen; ++i) {
        datasetIndex = +keys[i];
        if (datasetIndex === dsIndex) {
          if (options.all) {
            continue;
          }
          break;
        }
        otherValue = stack.values[datasetIndex];
        if (isNumberFinite(otherValue) && (singleMode || (value === 0 || sign(value) === sign(otherValue)))) {
          value += otherValue;
        }
      }
      return value;
    }
    function convertObjectDataToArray(data) {
      const keys = Object.keys(data);
      const adata = new Array(keys.length);
      let i, ilen, key;
      for (i = 0, ilen = keys.length; i < ilen; ++i) {
        key = keys[i];
        adata[i] = {
          x: key,
          y: data[key]
        };
      }
      return adata;
    }
    function isStacked(scale, meta) {
      const stacked = scale && scale.options.stacked;
      return stacked || (stacked === undefined && meta.stack !== undefined);
    }
    function getStackKey(indexScale, valueScale, meta) {
      return `${indexScale.id}.${valueScale.id}.${meta.stack || meta.type}`;
    }
    function getUserBounds(scale) {
      const {min, max, minDefined, maxDefined} = scale.getUserBounds();
      return {
        min: minDefined ? min : Number.NEGATIVE_INFINITY,
        max: maxDefined ? max : Number.POSITIVE_INFINITY
      };
    }
    function getOrCreateStack(stacks, stackKey, indexValue) {
      const subStack = stacks[stackKey] || (stacks[stackKey] = {});
      return subStack[indexValue] || (subStack[indexValue] = {});
    }
    function getLastIndexInStack(stack, vScale, positive, type) {
      for (const meta of vScale.getMatchingVisibleMetas(type).reverse()) {
        const value = stack[meta.index];
        if ((positive && value > 0) || (!positive && value < 0)) {
          return meta.index;
        }
      }
      return null;
    }
    function updateStacks(controller, parsed) {
      const {chart, _cachedMeta: meta} = controller;
      const stacks = chart._stacks || (chart._stacks = {});
      const {iScale, vScale, index: datasetIndex} = meta;
      const iAxis = iScale.axis;
      const vAxis = vScale.axis;
      const key = getStackKey(iScale, vScale, meta);
      const ilen = parsed.length;
      let stack;
      for (let i = 0; i < ilen; ++i) {
        const item = parsed[i];
        const {[iAxis]: index, [vAxis]: value} = item;
        const itemStacks = item._stacks || (item._stacks = {});
        stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index);
        stack[datasetIndex] = value;
        stack._top = getLastIndexInStack(stack, vScale, true, meta.type);
        stack._bottom = getLastIndexInStack(stack, vScale, false, meta.type);
      }
    }
    function getFirstScaleId(chart, axis) {
      const scales = chart.scales;
      return Object.keys(scales).filter(key => scales[key].axis === axis).shift();
    }
    function createDatasetContext(parent, index) {
      return createContext(parent,
        {
          active: false,
          dataset: undefined,
          datasetIndex: index,
          index,
          mode: 'default',
          type: 'dataset'
        }
      );
    }
    function createDataContext(parent, index, element) {
      return createContext(parent, {
        active: false,
        dataIndex: index,
        parsed: undefined,
        raw: undefined,
        element,
        index,
        mode: 'default',
        type: 'data'
      });
    }
    function clearStacks(meta, items) {
      const datasetIndex = meta.controller.index;
      const axis = meta.vScale && meta.vScale.axis;
      if (!axis) {
        return;
      }
      items = items || meta._parsed;
      for (const parsed of items) {
        const stacks = parsed._stacks;
        if (!stacks || stacks[axis] === undefined || stacks[axis][datasetIndex] === undefined) {
          return;
        }
        delete stacks[axis][datasetIndex];
      }
    }
    const isDirectUpdateMode = (mode) => mode === 'reset' || mode === 'none';
    const cloneIfNotShared = (cached, shared) => shared ? cached : Object.assign({}, cached);
    const createStack = (canStack, meta, chart) => canStack && !meta.hidden && meta._stacked
      && {keys: getSortedDatasetIndices(chart, true), values: null};
    class DatasetController {
      constructor(chart, datasetIndex) {
        this.chart = chart;
        this._ctx = chart.ctx;
        this.index = datasetIndex;
        this._cachedDataOpts = {};
        this._cachedMeta = this.getMeta();
        this._type = this._cachedMeta.type;
        this.options = undefined;
        this._parsing = false;
        this._data = undefined;
        this._objectData = undefined;
        this._sharedOptions = undefined;
        this._drawStart = undefined;
        this._drawCount = undefined;
        this.enableOptionSharing = false;
        this.$context = undefined;
        this._syncList = [];
        this.initialize();
      }
      initialize() {
        const meta = this._cachedMeta;
        this.configure();
        this.linkScales();
        meta._stacked = isStacked(meta.vScale, meta);
        this.addElements();
      }
      updateIndex(datasetIndex) {
        if (this.index !== datasetIndex) {
          clearStacks(this._cachedMeta);
        }
        this.index = datasetIndex;
      }
      linkScales() {
        const chart = this.chart;
        const meta = this._cachedMeta;
        const dataset = this.getDataset();
        const chooseId = (axis, x, y, r) => axis === 'x' ? x : axis === 'r' ? r : y;
        const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, 'x'));
        const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, 'y'));
        const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, 'r'));
        const indexAxis = meta.indexAxis;
        const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
        const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
        meta.xScale = this.getScaleForId(xid);
        meta.yScale = this.getScaleForId(yid);
        meta.rScale = this.getScaleForId(rid);
        meta.iScale = this.getScaleForId(iid);
        meta.vScale = this.getScaleForId(vid);
      }
      getDataset() {
        return this.chart.data.datasets[this.index];
      }
      getMeta() {
        return this.chart.getDatasetMeta(this.index);
      }
      getScaleForId(scaleID) {
        return this.chart.scales[scaleID];
      }
      _getOtherScale(scale) {
        const meta = this._cachedMeta;
        return scale === meta.iScale
          ? meta.vScale
          : meta.iScale;
      }
      reset() {
        this._update('reset');
      }
      _destroy() {
        const meta = this._cachedMeta;
        if (this._data) {
          unlistenArrayEvents(this._data, this);
        }
        if (meta._stacked) {
          clearStacks(meta);
        }
      }
      _dataCheck() {
        const dataset = this.getDataset();
        const data = dataset.data || (dataset.data = []);
        const _data = this._data;
        if (isObject(data)) {
          this._data = convertObjectDataToArray(data);
        } else if (_data !== data) {
          if (_data) {
            unlistenArrayEvents(_data, this);
            const meta = this._cachedMeta;
            clearStacks(meta);
            meta._parsed = [];
          }
          if (data && Object.isExtensible(data)) {
            listenArrayEvents(data, this);
          }
          this._syncList = [];
          this._data = data;
        }
      }
      addElements() {
        const meta = this._cachedMeta;
        this._dataCheck();
        if (this.datasetElementType) {
          meta.dataset = new this.datasetElementType();
        }
      }
      buildOrUpdateElements(resetNewElements) {
        const meta = this._cachedMeta;
        const dataset = this.getDataset();
        let stackChanged = false;
        this._dataCheck();
        const oldStacked = meta._stacked;
        meta._stacked = isStacked(meta.vScale, meta);
        if (meta.stack !== dataset.stack) {
          stackChanged = true;
          clearStacks(meta);
          meta.stack = dataset.stack;
        }
        this._resyncElements(resetNewElements);
        if (stackChanged || oldStacked !== meta._stacked) {
          updateStacks(this, meta._parsed);
        }
      }
      configure() {
        const config = this.chart.config;
        const scopeKeys = config.datasetScopeKeys(this._type);
        const scopes = config.getOptionScopes(this.getDataset(), scopeKeys, true);
        this.options = config.createResolver(scopes, this.getContext());
        this._parsing = this.options.parsing;
      }
      parse(start, count) {
        const {_cachedMeta: meta, _data: data} = this;
        const {iScale, _stacked} = meta;
        const iAxis = iScale.axis;
        let sorted = start === 0 && count === data.length ? true : meta._sorted;
        let prev = start > 0 && meta._parsed[start - 1];
        let i, cur, parsed;
        if (this._parsing === false) {
          meta._parsed = data;
          meta._sorted = true;
          parsed = data;
        } else {
          if (isArray(data[start])) {
            parsed = this.parseArrayData(meta, data, start, count);
          } else if (isObject(data[start])) {
            parsed = this.parseObjectData(meta, data, start, count);
          } else {
            parsed = this.parsePrimitiveData(meta, data, start, count);
          }
          const isNotInOrderComparedToPrev = () => cur[iAxis] === null || (prev && cur[iAxis] < prev[iAxis]);
          for (i = 0; i < count; ++i) {
            meta._parsed[i + start] = cur = parsed[i];
            if (sorted) {
              if (isNotInOrderComparedToPrev()) {
                sorted = false;
              }
              prev = cur;
            }
          }
          meta._sorted = sorted;
        }
        if (_stacked) {
          updateStacks(this, parsed);
        }
      }
      parsePrimitiveData(meta, data, start, count) {
        const {iScale, vScale} = meta;
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        const labels = iScale.getLabels();
        const singleScale = iScale === vScale;
        const parsed = new Array(count);
        let i, ilen, index;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index = i + start;
          parsed[i] = {
            [iAxis]: singleScale || iScale.parse(labels[index], index),
            [vAxis]: vScale.parse(data[index], index)
          };
        }
        return parsed;
      }
      parseArrayData(meta, data, start, count) {
        const {xScale, yScale} = meta;
        const parsed = new Array(count);
        let i, ilen, index, item;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index = i + start;
          item = data[index];
          parsed[i] = {
            x: xScale.parse(item[0], index),
            y: yScale.parse(item[1], index)
          };
        }
        return parsed;
      }
      parseObjectData(meta, data, start, count) {
        const {xScale, yScale} = meta;
        const {xAxisKey = 'x', yAxisKey = 'y'} = this._parsing;
        const parsed = new Array(count);
        let i, ilen, index, item;
        for (i = 0, ilen = count; i < ilen; ++i) {
          index = i + start;
          item = data[index];
          parsed[i] = {
            x: xScale.parse(resolveObjectKey(item, xAxisKey), index),
            y: yScale.parse(resolveObjectKey(item, yAxisKey), index)
          };
        }
        return parsed;
      }
      getParsed(index) {
        return this._cachedMeta._parsed[index];
      }
      getDataElement(index) {
        return this._cachedMeta.data[index];
      }
      applyStack(scale, parsed, mode) {
        const chart = this.chart;
        const meta = this._cachedMeta;
        const value = parsed[scale.axis];
        const stack = {
          keys: getSortedDatasetIndices(chart, true),
          values: parsed._stacks[scale.axis]
        };
        return applyStack(stack, value, meta.index, {mode});
      }
      updateRangeFromParsed(range, scale, parsed, stack) {
        const parsedValue = parsed[scale.axis];
        let value = parsedValue === null ? NaN : parsedValue;
        const values = stack && parsed._stacks[scale.axis];
        if (stack && values) {
          stack.values = values;
          value = applyStack(stack, parsedValue, this._cachedMeta.index);
        }
        range.min = Math.min(range.min, value);
        range.max = Math.max(range.max, value);
      }
      getMinMax(scale, canStack) {
        const meta = this._cachedMeta;
        const _parsed = meta._parsed;
        const sorted = meta._sorted && scale === meta.iScale;
        const ilen = _parsed.length;
        const otherScale = this._getOtherScale(scale);
        const stack = createStack(canStack, meta, this.chart);
        const range = {min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY};
        const {min: otherMin, max: otherMax} = getUserBounds(otherScale);
        let i, parsed;
        function _skip() {
          parsed = _parsed[i];
          const otherValue = parsed[otherScale.axis];
          return !isNumberFinite(parsed[scale.axis]) || otherMin > otherValue || otherMax < otherValue;
        }
        for (i = 0; i < ilen; ++i) {
          if (_skip()) {
            continue;
          }
          this.updateRangeFromParsed(range, scale, parsed, stack);
          if (sorted) {
            break;
          }
        }
        if (sorted) {
          for (i = ilen - 1; i >= 0; --i) {
            if (_skip()) {
              continue;
            }
            this.updateRangeFromParsed(range, scale, parsed, stack);
            break;
          }
        }
        return range;
      }
      getAllParsedValues(scale) {
        const parsed = this._cachedMeta._parsed;
        const values = [];
        let i, ilen, value;
        for (i = 0, ilen = parsed.length; i < ilen; ++i) {
          value = parsed[i][scale.axis];
          if (isNumberFinite(value)) {
            values.push(value);
          }
        }
        return values;
      }
      getMaxOverflow() {
        return false;
      }
      getLabelAndValue(index) {
        const meta = this._cachedMeta;
        const iScale = meta.iScale;
        const vScale = meta.vScale;
        const parsed = this.getParsed(index);
        return {
          label: iScale ? '' + iScale.getLabelForValue(parsed[iScale.axis]) : '',
          value: vScale ? '' + vScale.getLabelForValue(parsed[vScale.axis]) : ''
        };
      }
      _update(mode) {
        const meta = this._cachedMeta;
        this.configure();
        this._cachedDataOpts = {};
        this.update(mode || 'default');
        meta._clip = toClip(valueOrDefault(this.options.clip, defaultClip(meta.xScale, meta.yScale, this.getMaxOverflow())));
      }
      update(mode) {}
      draw() {
        const ctx = this._ctx;
        const chart = this.chart;
        const meta = this._cachedMeta;
        const elements = meta.data || [];
        const area = chart.chartArea;
        const active = [];
        const start = this._drawStart || 0;
        const count = this._drawCount || (elements.length - start);
        let i;
        if (meta.dataset) {
          meta.dataset.draw(ctx, area, start, count);
        }
        for (i = start; i < start + count; ++i) {
          const element = elements[i];
          if (element.hidden) {
            continue;
          }
          if (element.active) {
            active.push(element);
          } else {
            element.draw(ctx, area);
          }
        }
        for (i = 0; i < active.length; ++i) {
          active[i].draw(ctx, area);
        }
      }
      getStyle(index, active) {
        const mode = active ? 'active' : 'default';
        return index === undefined && this._cachedMeta.dataset
          ? this.resolveDatasetElementOptions(mode)
          : this.resolveDataElementOptions(index || 0, mode);
      }
      getContext(index, active, mode) {
        const dataset = this.getDataset();
        let context;
        if (index >= 0 && index < this._cachedMeta.data.length) {
          const element = this._cachedMeta.data[index];
          context = element.$context ||
            (element.$context = createDataContext(this.getContext(), index, element));
          context.parsed = this.getParsed(index);
          context.raw = dataset.data[index];
          context.index = context.dataIndex = index;
        } else {
          context = this.$context ||
            (this.$context = createDatasetContext(this.chart.getContext(), this.index));
          context.dataset = dataset;
          context.index = context.datasetIndex = this.index;
        }
        context.active = !!active;
        context.mode = mode;
        return context;
      }
      resolveDatasetElementOptions(mode) {
        return this._resolveElementOptions(this.datasetElementType.id, mode);
      }
      resolveDataElementOptions(index, mode) {
        return this._resolveElementOptions(this.dataElementType.id, mode, index);
      }
      _resolveElementOptions(elementType, mode = 'default', index) {
        const active = mode === 'active';
        const cache = this._cachedDataOpts;
        const cacheKey = elementType + '-' + mode;
        const cached = cache[cacheKey];
        const sharing = this.enableOptionSharing && defined(index);
        if (cached) {
          return cloneIfNotShared(cached, sharing);
        }
        const config = this.chart.config;
        const scopeKeys = config.datasetElementScopeKeys(this._type, elementType);
        const prefixes = active ? [`${elementType}Hover`, 'hover', elementType, ''] : [elementType, ''];
        const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
        const names = Object.keys(defaults.elements[elementType]);
        const context = () => this.getContext(index, active);
        const values = config.resolveNamedOptions(scopes, names, context, prefixes);
        if (values.$shared) {
          values.$shared = sharing;
          cache[cacheKey] = Object.freeze(cloneIfNotShared(values, sharing));
        }
        return values;
      }
      _resolveAnimations(index, transition, active) {
        const chart = this.chart;
        const cache = this._cachedDataOpts;
        const cacheKey = `animation-${transition}`;
        const cached = cache[cacheKey];
        if (cached) {
          return cached;
        }
        let options;
        if (chart.options.animation !== false) {
          const config = this.chart.config;
          const scopeKeys = config.datasetAnimationScopeKeys(this._type, transition);
          const scopes = config.getOptionScopes(this.getDataset(), scopeKeys);
          options = config.createResolver(scopes, this.getContext(index, active, transition));
        }
        const animations = new Animations(chart, options && options.animations);
        if (options && options._cacheable) {
          cache[cacheKey] = Object.freeze(animations);
        }
        return animations;
      }
      getSharedOptions(options) {
        if (!options.$shared) {
          return;
        }
        return this._sharedOptions || (this._sharedOptions = Object.assign({}, options));
      }
      includeOptions(mode, sharedOptions) {
        return !sharedOptions || isDirectUpdateMode(mode) || this.chart._animationsDisabled;
      }
      updateElement(element, index, properties, mode) {
        if (isDirectUpdateMode(mode)) {
          Object.assign(element, properties);
        } else {
          this._resolveAnimations(index, mode).update(element, properties);
        }
      }
      updateSharedOptions(sharedOptions, mode, newOptions) {
        if (sharedOptions && !isDirectUpdateMode(mode)) {
          this._resolveAnimations(undefined, mode).update(sharedOptions, newOptions);
        }
      }
      _setStyle(element, index, mode, active) {
        element.active = active;
        const options = this.getStyle(index, active);
        this._resolveAnimations(index, mode, active).update(element, {
          options: (!active && this.getSharedOptions(options)) || options
        });
      }
      removeHoverStyle(element, datasetIndex, index) {
        this._setStyle(element, index, 'active', false);
      }
      setHoverStyle(element, datasetIndex, index) {
        this._setStyle(element, index, 'active', true);
      }
      _removeDatasetHoverStyle() {
        const element = this._cachedMeta.dataset;
        if (element) {
          this._setStyle(element, undefined, 'active', false);
        }
      }
      _setDatasetHoverStyle() {
        const element = this._cachedMeta.dataset;
        if (element) {
          this._setStyle(element, undefined, 'active', true);
        }
      }
      _resyncElements(resetNewElements) {
        const data = this._data;
        const elements = this._cachedMeta.data;
        for (const [method, arg1, arg2] of this._syncList) {
          this[method](arg1, arg2);
        }
        this._syncList = [];
        const numMeta = elements.length;
        const numData = data.length;
        const count = Math.min(numData, numMeta);
        if (count) {
          this.parse(0, count);
        }
        if (numData > numMeta) {
          this._insertElements(numMeta, numData - numMeta, resetNewElements);
        } else if (numData < numMeta) {
          this._removeElements(numData, numMeta - numData);
        }
      }
      _insertElements(start, count, resetNewElements = true) {
        const meta = this._cachedMeta;
        const data = meta.data;
        const end = start + count;
        let i;
        const move = (arr) => {
          arr.length += count;
          for (i = arr.length - 1; i >= end; i--) {
            arr[i] = arr[i - count];
          }
        };
        move(data);
        for (i = start; i < end; ++i) {
          data[i] = new this.dataElementType();
        }
        if (this._parsing) {
          move(meta._parsed);
        }
        this.parse(start, count);
        if (resetNewElements) {
          this.updateElements(data, start, count, 'reset');
        }
      }
      updateElements(element, start, count, mode) {}
      _removeElements(start, count) {
        const meta = this._cachedMeta;
        if (this._parsing) {
          const removed = meta._parsed.splice(start, count);
          if (meta._stacked) {
            clearStacks(meta, removed);
          }
        }
        meta.data.splice(start, count);
      }
      _sync(args) {
        if (this._parsing) {
          this._syncList.push(args);
        } else {
          const [method, arg1, arg2] = args;
          this[method](arg1, arg2);
        }
      }
      _onDataPush() {
        const count = arguments.length;
        this._sync(['_insertElements', this.getDataset().data.length - count, count]);
      }
      _onDataPop() {
        this._sync(['_removeElements', this._cachedMeta.data.length - 1, 1]);
      }
      _onDataShift() {
        this._sync(['_removeElements', 0, 1]);
      }
      _onDataSplice(start, count) {
        this._sync(['_removeElements', start, count]);
        this._sync(['_insertElements', start, arguments.length - 2]);
      }
      _onDataUnshift() {
        this._sync(['_insertElements', 0, arguments.length]);
      }
    }
    DatasetController.defaults = {};
    DatasetController.prototype.datasetElementType = null;
    DatasetController.prototype.dataElementType = null;

    function getAllScaleValues(scale, type) {
      if (!scale._cache.$bar) {
        const visibleMetas = scale.getMatchingVisibleMetas(type);
        let values = [];
        for (let i = 0, ilen = visibleMetas.length; i < ilen; i++) {
          values = values.concat(visibleMetas[i].controller.getAllParsedValues(scale));
        }
        scale._cache.$bar = _arrayUnique(values.sort((a, b) => a - b));
      }
      return scale._cache.$bar;
    }
    function computeMinSampleSize(meta) {
      const scale = meta.iScale;
      const values = getAllScaleValues(scale, meta.type);
      let min = scale._length;
      let i, ilen, curr, prev;
      const updateMinAndPrev = () => {
        if (curr === 32767 || curr === -32768) {
          return;
        }
        if (defined(prev)) {
          min = Math.min(min, Math.abs(curr - prev) || min);
        }
        prev = curr;
      };
      for (i = 0, ilen = values.length; i < ilen; ++i) {
        curr = scale.getPixelForValue(values[i]);
        updateMinAndPrev();
      }
      prev = undefined;
      for (i = 0, ilen = scale.ticks.length; i < ilen; ++i) {
        curr = scale.getPixelForTick(i);
        updateMinAndPrev();
      }
      return min;
    }
    function computeFitCategoryTraits(index, ruler, options, stackCount) {
      const thickness = options.barThickness;
      let size, ratio;
      if (isNullOrUndef(thickness)) {
        size = ruler.min * options.categoryPercentage;
        ratio = options.barPercentage;
      } else {
        size = thickness * stackCount;
        ratio = 1;
      }
      return {
        chunk: size / stackCount,
        ratio,
        start: ruler.pixels[index] - (size / 2)
      };
    }
    function computeFlexCategoryTraits(index, ruler, options, stackCount) {
      const pixels = ruler.pixels;
      const curr = pixels[index];
      let prev = index > 0 ? pixels[index - 1] : null;
      let next = index < pixels.length - 1 ? pixels[index + 1] : null;
      const percent = options.categoryPercentage;
      if (prev === null) {
        prev = curr - (next === null ? ruler.end - ruler.start : next - curr);
      }
      if (next === null) {
        next = curr + curr - prev;
      }
      const start = curr - (curr - Math.min(prev, next)) / 2 * percent;
      const size = Math.abs(next - prev) / 2 * percent;
      return {
        chunk: size / stackCount,
        ratio: options.barPercentage,
        start
      };
    }
    function parseFloatBar(entry, item, vScale, i) {
      const startValue = vScale.parse(entry[0], i);
      const endValue = vScale.parse(entry[1], i);
      const min = Math.min(startValue, endValue);
      const max = Math.max(startValue, endValue);
      let barStart = min;
      let barEnd = max;
      if (Math.abs(min) > Math.abs(max)) {
        barStart = max;
        barEnd = min;
      }
      item[vScale.axis] = barEnd;
      item._custom = {
        barStart,
        barEnd,
        start: startValue,
        end: endValue,
        min,
        max
      };
    }
    function parseValue(entry, item, vScale, i) {
      if (isArray(entry)) {
        parseFloatBar(entry, item, vScale, i);
      } else {
        item[vScale.axis] = vScale.parse(entry, i);
      }
      return item;
    }
    function parseArrayOrPrimitive(meta, data, start, count) {
      const iScale = meta.iScale;
      const vScale = meta.vScale;
      const labels = iScale.getLabels();
      const singleScale = iScale === vScale;
      const parsed = [];
      let i, ilen, item, entry;
      for (i = start, ilen = start + count; i < ilen; ++i) {
        entry = data[i];
        item = {};
        item[iScale.axis] = singleScale || iScale.parse(labels[i], i);
        parsed.push(parseValue(entry, item, vScale, i));
      }
      return parsed;
    }
    function isFloatBar(custom) {
      return custom && custom.barStart !== undefined && custom.barEnd !== undefined;
    }
    function barSign(size, vScale, actualBase) {
      if (size !== 0) {
        return sign(size);
      }
      return (vScale.isHorizontal() ? 1 : -1) * (vScale.min >= actualBase ? 1 : -1);
    }
    function borderProps(properties) {
      let reverse, start, end, top, bottom;
      if (properties.horizontal) {
        reverse = properties.base > properties.x;
        start = 'left';
        end = 'right';
      } else {
        reverse = properties.base < properties.y;
        start = 'bottom';
        end = 'top';
      }
      if (reverse) {
        top = 'end';
        bottom = 'start';
      } else {
        top = 'start';
        bottom = 'end';
      }
      return {start, end, reverse, top, bottom};
    }
    function setBorderSkipped(properties, options, stack, index) {
      let edge = options.borderSkipped;
      const res = {};
      if (!edge) {
        properties.borderSkipped = res;
        return;
      }
      const {start, end, reverse, top, bottom} = borderProps(properties);
      if (edge === 'middle' && stack) {
        properties.enableBorderRadius = true;
        if ((stack._top || 0) === index) {
          edge = top;
        } else if ((stack._bottom || 0) === index) {
          edge = bottom;
        } else {
          res[parseEdge(bottom, start, end, reverse)] = true;
          edge = top;
        }
      }
      res[parseEdge(edge, start, end, reverse)] = true;
      properties.borderSkipped = res;
    }
    function parseEdge(edge, a, b, reverse) {
      if (reverse) {
        edge = swap(edge, a, b);
        edge = startEnd(edge, b, a);
      } else {
        edge = startEnd(edge, a, b);
      }
      return edge;
    }
    function swap(orig, v1, v2) {
      return orig === v1 ? v2 : orig === v2 ? v1 : orig;
    }
    function startEnd(v, start, end) {
      return v === 'start' ? start : v === 'end' ? end : v;
    }
    function setInflateAmount(properties, {inflateAmount}, ratio) {
      properties.inflateAmount = inflateAmount === 'auto'
        ? ratio === 1 ? 0.33 : 0
        : inflateAmount;
    }
    class BarController extends DatasetController {
      parsePrimitiveData(meta, data, start, count) {
        return parseArrayOrPrimitive(meta, data, start, count);
      }
      parseArrayData(meta, data, start, count) {
        return parseArrayOrPrimitive(meta, data, start, count);
      }
      parseObjectData(meta, data, start, count) {
        const {iScale, vScale} = meta;
        const {xAxisKey = 'x', yAxisKey = 'y'} = this._parsing;
        const iAxisKey = iScale.axis === 'x' ? xAxisKey : yAxisKey;
        const vAxisKey = vScale.axis === 'x' ? xAxisKey : yAxisKey;
        const parsed = [];
        let i, ilen, item, obj;
        for (i = start, ilen = start + count; i < ilen; ++i) {
          obj = data[i];
          item = {};
          item[iScale.axis] = iScale.parse(resolveObjectKey(obj, iAxisKey), i);
          parsed.push(parseValue(resolveObjectKey(obj, vAxisKey), item, vScale, i));
        }
        return parsed;
      }
      updateRangeFromParsed(range, scale, parsed, stack) {
        super.updateRangeFromParsed(range, scale, parsed, stack);
        const custom = parsed._custom;
        if (custom && scale === this._cachedMeta.vScale) {
          range.min = Math.min(range.min, custom.min);
          range.max = Math.max(range.max, custom.max);
        }
      }
      getMaxOverflow() {
        return 0;
      }
      getLabelAndValue(index) {
        const meta = this._cachedMeta;
        const {iScale, vScale} = meta;
        const parsed = this.getParsed(index);
        const custom = parsed._custom;
        const value = isFloatBar(custom)
          ? '[' + custom.start + ', ' + custom.end + ']'
          : '' + vScale.getLabelForValue(parsed[vScale.axis]);
        return {
          label: '' + iScale.getLabelForValue(parsed[iScale.axis]),
          value
        };
      }
      initialize() {
        this.enableOptionSharing = true;
        super.initialize();
        const meta = this._cachedMeta;
        meta.stack = this.getDataset().stack;
      }
      update(mode) {
        const meta = this._cachedMeta;
        this.updateElements(meta.data, 0, meta.data.length, mode);
      }
      updateElements(bars, start, count, mode) {
        const reset = mode === 'reset';
        const {index, _cachedMeta: {vScale}} = this;
        const base = vScale.getBasePixel();
        const horizontal = vScale.isHorizontal();
        const ruler = this._getRuler();
        const firstOpts = this.resolveDataElementOptions(start, mode);
        const sharedOptions = this.getSharedOptions(firstOpts);
        const includeOptions = this.includeOptions(mode, sharedOptions);
        this.updateSharedOptions(sharedOptions, mode, firstOpts);
        for (let i = start; i < start + count; i++) {
          const parsed = this.getParsed(i);
          const vpixels = reset || isNullOrUndef(parsed[vScale.axis]) ? {base, head: base} : this._calculateBarValuePixels(i);
          const ipixels = this._calculateBarIndexPixels(i, ruler);
          const stack = (parsed._stacks || {})[vScale.axis];
          const properties = {
            horizontal,
            base: vpixels.base,
            enableBorderRadius: !stack || isFloatBar(parsed._custom) || (index === stack._top || index === stack._bottom),
            x: horizontal ? vpixels.head : ipixels.center,
            y: horizontal ? ipixels.center : vpixels.head,
            height: horizontal ? ipixels.size : Math.abs(vpixels.size),
            width: horizontal ? Math.abs(vpixels.size) : ipixels.size
          };
          if (includeOptions) {
            properties.options = sharedOptions || this.resolveDataElementOptions(i, bars[i].active ? 'active' : mode);
          }
          const options = properties.options || bars[i].options;
          setBorderSkipped(properties, options, stack, index);
          setInflateAmount(properties, options, ruler.ratio);
          this.updateElement(bars[i], i, properties, mode);
        }
      }
      _getStacks(last, dataIndex) {
        const meta = this._cachedMeta;
        const iScale = meta.iScale;
        const metasets = iScale.getMatchingVisibleMetas(this._type);
        const stacked = iScale.options.stacked;
        const ilen = metasets.length;
        const stacks = [];
        let i, item;
        for (i = 0; i < ilen; ++i) {
          item = metasets[i];
          if (!item.controller.options.grouped) {
            continue;
          }
          if (typeof dataIndex !== 'undefined') {
            const val = item.controller.getParsed(dataIndex)[
              item.controller._cachedMeta.vScale.axis
            ];
            if (isNullOrUndef(val) || isNaN(val)) {
              continue;
            }
          }
          if (stacked === false || stacks.indexOf(item.stack) === -1 ||
    				(stacked === undefined && item.stack === undefined)) {
            stacks.push(item.stack);
          }
          if (item.index === last) {
            break;
          }
        }
        if (!stacks.length) {
          stacks.push(undefined);
        }
        return stacks;
      }
      _getStackCount(index) {
        return this._getStacks(undefined, index).length;
      }
      _getStackIndex(datasetIndex, name, dataIndex) {
        const stacks = this._getStacks(datasetIndex, dataIndex);
        const index = (name !== undefined)
          ? stacks.indexOf(name)
          : -1;
        return (index === -1)
          ? stacks.length - 1
          : index;
      }
      _getRuler() {
        const opts = this.options;
        const meta = this._cachedMeta;
        const iScale = meta.iScale;
        const pixels = [];
        let i, ilen;
        for (i = 0, ilen = meta.data.length; i < ilen; ++i) {
          pixels.push(iScale.getPixelForValue(this.getParsed(i)[iScale.axis], i));
        }
        const barThickness = opts.barThickness;
        const min = barThickness || computeMinSampleSize(meta);
        return {
          min,
          pixels,
          start: iScale._startPixel,
          end: iScale._endPixel,
          stackCount: this._getStackCount(),
          scale: iScale,
          grouped: opts.grouped,
          ratio: barThickness ? 1 : opts.categoryPercentage * opts.barPercentage
        };
      }
      _calculateBarValuePixels(index) {
        const {_cachedMeta: {vScale, _stacked}, options: {base: baseValue, minBarLength}} = this;
        const actualBase = baseValue || 0;
        const parsed = this.getParsed(index);
        const custom = parsed._custom;
        const floating = isFloatBar(custom);
        let value = parsed[vScale.axis];
        let start = 0;
        let length = _stacked ? this.applyStack(vScale, parsed, _stacked) : value;
        let head, size;
        if (length !== value) {
          start = length - value;
          length = value;
        }
        if (floating) {
          value = custom.barStart;
          length = custom.barEnd - custom.barStart;
          if (value !== 0 && sign(value) !== sign(custom.barEnd)) {
            start = 0;
          }
          start += value;
        }
        const startValue = !isNullOrUndef(baseValue) && !floating ? baseValue : start;
        let base = vScale.getPixelForValue(startValue);
        if (this.chart.getDataVisibility(index)) {
          head = vScale.getPixelForValue(start + length);
        } else {
          head = base;
        }
        size = head - base;
        if (Math.abs(size) < minBarLength) {
          size = barSign(size, vScale, actualBase) * minBarLength;
          if (value === actualBase) {
            base -= size / 2;
          }
          head = base + size;
        }
        if (base === vScale.getPixelForValue(actualBase)) {
          const halfGrid = sign(size) * vScale.getLineWidthForValue(actualBase) / 2;
          base += halfGrid;
          size -= halfGrid;
        }
        return {
          size,
          base,
          head,
          center: head + size / 2
        };
      }
      _calculateBarIndexPixels(index, ruler) {
        const scale = ruler.scale;
        const options = this.options;
        const skipNull = options.skipNull;
        const maxBarThickness = valueOrDefault(options.maxBarThickness, Infinity);
        let center, size;
        if (ruler.grouped) {
          const stackCount = skipNull ? this._getStackCount(index) : ruler.stackCount;
          const range = options.barThickness === 'flex'
            ? computeFlexCategoryTraits(index, ruler, options, stackCount)
            : computeFitCategoryTraits(index, ruler, options, stackCount);
          const stackIndex = this._getStackIndex(this.index, this._cachedMeta.stack, skipNull ? index : undefined);
          center = range.start + (range.chunk * stackIndex) + (range.chunk / 2);
          size = Math.min(maxBarThickness, range.chunk * range.ratio);
        } else {
          center = scale.getPixelForValue(this.getParsed(index)[scale.axis], index);
          size = Math.min(maxBarThickness, ruler.min * ruler.ratio);
        }
        return {
          base: center - size / 2,
          head: center + size / 2,
          center,
          size
        };
      }
      draw() {
        const meta = this._cachedMeta;
        const vScale = meta.vScale;
        const rects = meta.data;
        const ilen = rects.length;
        let i = 0;
        for (; i < ilen; ++i) {
          if (this.getParsed(i)[vScale.axis] !== null) {
            rects[i].draw(this._ctx);
          }
        }
      }
    }
    BarController.id = 'bar';
    BarController.defaults = {
      datasetElementType: false,
      dataElementType: 'bar',
      categoryPercentage: 0.8,
      barPercentage: 0.9,
      grouped: true,
      animations: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'base', 'width', 'height']
        }
      }
    };
    BarController.overrides = {
      scales: {
        _index_: {
          type: 'category',
          offset: true,
          grid: {
            offset: true
          }
        },
        _value_: {
          type: 'linear',
          beginAtZero: true,
        }
      }
    };

    class BubbleController extends DatasetController {
      initialize() {
        this.enableOptionSharing = true;
        super.initialize();
      }
      parsePrimitiveData(meta, data, start, count) {
        const parsed = super.parsePrimitiveData(meta, data, start, count);
        for (let i = 0; i < parsed.length; i++) {
          parsed[i]._custom = this.resolveDataElementOptions(i + start).radius;
        }
        return parsed;
      }
      parseArrayData(meta, data, start, count) {
        const parsed = super.parseArrayData(meta, data, start, count);
        for (let i = 0; i < parsed.length; i++) {
          const item = data[start + i];
          parsed[i]._custom = valueOrDefault(item[2], this.resolveDataElementOptions(i + start).radius);
        }
        return parsed;
      }
      parseObjectData(meta, data, start, count) {
        const parsed = super.parseObjectData(meta, data, start, count);
        for (let i = 0; i < parsed.length; i++) {
          const item = data[start + i];
          parsed[i]._custom = valueOrDefault(item && item.r && +item.r, this.resolveDataElementOptions(i + start).radius);
        }
        return parsed;
      }
      getMaxOverflow() {
        const data = this._cachedMeta.data;
        let max = 0;
        for (let i = data.length - 1; i >= 0; --i) {
          max = Math.max(max, data[i].size(this.resolveDataElementOptions(i)) / 2);
        }
        return max > 0 && max;
      }
      getLabelAndValue(index) {
        const meta = this._cachedMeta;
        const {xScale, yScale} = meta;
        const parsed = this.getParsed(index);
        const x = xScale.getLabelForValue(parsed.x);
        const y = yScale.getLabelForValue(parsed.y);
        const r = parsed._custom;
        return {
          label: meta.label,
          value: '(' + x + ', ' + y + (r ? ', ' + r : '') + ')'
        };
      }
      update(mode) {
        const points = this._cachedMeta.data;
        this.updateElements(points, 0, points.length, mode);
      }
      updateElements(points, start, count, mode) {
        const reset = mode === 'reset';
        const {iScale, vScale} = this._cachedMeta;
        const firstOpts = this.resolveDataElementOptions(start, mode);
        const sharedOptions = this.getSharedOptions(firstOpts);
        const includeOptions = this.includeOptions(mode, sharedOptions);
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        for (let i = start; i < start + count; i++) {
          const point = points[i];
          const parsed = !reset && this.getParsed(i);
          const properties = {};
          const iPixel = properties[iAxis] = reset ? iScale.getPixelForDecimal(0.5) : iScale.getPixelForValue(parsed[iAxis]);
          const vPixel = properties[vAxis] = reset ? vScale.getBasePixel() : vScale.getPixelForValue(parsed[vAxis]);
          properties.skip = isNaN(iPixel) || isNaN(vPixel);
          if (includeOptions) {
            properties.options = this.resolveDataElementOptions(i, point.active ? 'active' : mode);
            if (reset) {
              properties.options.radius = 0;
            }
          }
          this.updateElement(point, i, properties, mode);
        }
        this.updateSharedOptions(sharedOptions, mode, firstOpts);
      }
      resolveDataElementOptions(index, mode) {
        const parsed = this.getParsed(index);
        let values = super.resolveDataElementOptions(index, mode);
        if (values.$shared) {
          values = Object.assign({}, values, {$shared: false});
        }
        const radius = values.radius;
        if (mode !== 'active') {
          values.radius = 0;
        }
        values.radius += valueOrDefault(parsed && parsed._custom, radius);
        return values;
      }
    }
    BubbleController.id = 'bubble';
    BubbleController.defaults = {
      datasetElementType: false,
      dataElementType: 'point',
      animations: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'borderWidth', 'radius']
        }
      }
    };
    BubbleController.overrides = {
      scales: {
        x: {
          type: 'linear'
        },
        y: {
          type: 'linear'
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title() {
              return '';
            }
          }
        }
      }
    };

    function getRatioAndOffset(rotation, circumference, cutout) {
      let ratioX = 1;
      let ratioY = 1;
      let offsetX = 0;
      let offsetY = 0;
      if (circumference < TAU) {
        const startAngle = rotation;
        const endAngle = startAngle + circumference;
        const startX = Math.cos(startAngle);
        const startY = Math.sin(startAngle);
        const endX = Math.cos(endAngle);
        const endY = Math.sin(endAngle);
        const calcMax = (angle, a, b) => _angleBetween(angle, startAngle, endAngle, true) ? 1 : Math.max(a, a * cutout, b, b * cutout);
        const calcMin = (angle, a, b) => _angleBetween(angle, startAngle, endAngle, true) ? -1 : Math.min(a, a * cutout, b, b * cutout);
        const maxX = calcMax(0, startX, endX);
        const maxY = calcMax(HALF_PI, startY, endY);
        const minX = calcMin(PI, startX, endX);
        const minY = calcMin(PI + HALF_PI, startY, endY);
        ratioX = (maxX - minX) / 2;
        ratioY = (maxY - minY) / 2;
        offsetX = -(maxX + minX) / 2;
        offsetY = -(maxY + minY) / 2;
      }
      return {ratioX, ratioY, offsetX, offsetY};
    }
    class DoughnutController extends DatasetController {
      constructor(chart, datasetIndex) {
        super(chart, datasetIndex);
        this.enableOptionSharing = true;
        this.innerRadius = undefined;
        this.outerRadius = undefined;
        this.offsetX = undefined;
        this.offsetY = undefined;
      }
      linkScales() {}
      parse(start, count) {
        const data = this.getDataset().data;
        const meta = this._cachedMeta;
        if (this._parsing === false) {
          meta._parsed = data;
        } else {
          let getter = (i) => +data[i];
          if (isObject(data[start])) {
            const {key = 'value'} = this._parsing;
            getter = (i) => +resolveObjectKey(data[i], key);
          }
          let i, ilen;
          for (i = start, ilen = start + count; i < ilen; ++i) {
            meta._parsed[i] = getter(i);
          }
        }
      }
      _getRotation() {
        return toRadians(this.options.rotation - 90);
      }
      _getCircumference() {
        return toRadians(this.options.circumference);
      }
      _getRotationExtents() {
        let min = TAU;
        let max = -TAU;
        for (let i = 0; i < this.chart.data.datasets.length; ++i) {
          if (this.chart.isDatasetVisible(i)) {
            const controller = this.chart.getDatasetMeta(i).controller;
            const rotation = controller._getRotation();
            const circumference = controller._getCircumference();
            min = Math.min(min, rotation);
            max = Math.max(max, rotation + circumference);
          }
        }
        return {
          rotation: min,
          circumference: max - min,
        };
      }
      update(mode) {
        const chart = this.chart;
        const {chartArea} = chart;
        const meta = this._cachedMeta;
        const arcs = meta.data;
        const spacing = this.getMaxBorderWidth() + this.getMaxOffset(arcs) + this.options.spacing;
        const maxSize = Math.max((Math.min(chartArea.width, chartArea.height) - spacing) / 2, 0);
        const cutout = Math.min(toPercentage(this.options.cutout, maxSize), 1);
        const chartWeight = this._getRingWeight(this.index);
        const {circumference, rotation} = this._getRotationExtents();
        const {ratioX, ratioY, offsetX, offsetY} = getRatioAndOffset(rotation, circumference, cutout);
        const maxWidth = (chartArea.width - spacing) / ratioX;
        const maxHeight = (chartArea.height - spacing) / ratioY;
        const maxRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
        const outerRadius = toDimension(this.options.radius, maxRadius);
        const innerRadius = Math.max(outerRadius * cutout, 0);
        const radiusLength = (outerRadius - innerRadius) / this._getVisibleDatasetWeightTotal();
        this.offsetX = offsetX * outerRadius;
        this.offsetY = offsetY * outerRadius;
        meta.total = this.calculateTotal();
        this.outerRadius = outerRadius - radiusLength * this._getRingWeightOffset(this.index);
        this.innerRadius = Math.max(this.outerRadius - radiusLength * chartWeight, 0);
        this.updateElements(arcs, 0, arcs.length, mode);
      }
      _circumference(i, reset) {
        const opts = this.options;
        const meta = this._cachedMeta;
        const circumference = this._getCircumference();
        if ((reset && opts.animation.animateRotate) || !this.chart.getDataVisibility(i) || meta._parsed[i] === null || meta.data[i].hidden) {
          return 0;
        }
        return this.calculateCircumference(meta._parsed[i] * circumference / TAU);
      }
      updateElements(arcs, start, count, mode) {
        const reset = mode === 'reset';
        const chart = this.chart;
        const chartArea = chart.chartArea;
        const opts = chart.options;
        const animationOpts = opts.animation;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;
        const animateScale = reset && animationOpts.animateScale;
        const innerRadius = animateScale ? 0 : this.innerRadius;
        const outerRadius = animateScale ? 0 : this.outerRadius;
        const firstOpts = this.resolveDataElementOptions(start, mode);
        const sharedOptions = this.getSharedOptions(firstOpts);
        const includeOptions = this.includeOptions(mode, sharedOptions);
        let startAngle = this._getRotation();
        let i;
        for (i = 0; i < start; ++i) {
          startAngle += this._circumference(i, reset);
        }
        for (i = start; i < start + count; ++i) {
          const circumference = this._circumference(i, reset);
          const arc = arcs[i];
          const properties = {
            x: centerX + this.offsetX,
            y: centerY + this.offsetY,
            startAngle,
            endAngle: startAngle + circumference,
            circumference,
            outerRadius,
            innerRadius
          };
          if (includeOptions) {
            properties.options = sharedOptions || this.resolveDataElementOptions(i, arc.active ? 'active' : mode);
          }
          startAngle += circumference;
          this.updateElement(arc, i, properties, mode);
        }
        this.updateSharedOptions(sharedOptions, mode, firstOpts);
      }
      calculateTotal() {
        const meta = this._cachedMeta;
        const metaData = meta.data;
        let total = 0;
        let i;
        for (i = 0; i < metaData.length; i++) {
          const value = meta._parsed[i];
          if (value !== null && !isNaN(value) && this.chart.getDataVisibility(i) && !metaData[i].hidden) {
            total += Math.abs(value);
          }
        }
        return total;
      }
      calculateCircumference(value) {
        const total = this._cachedMeta.total;
        if (total > 0 && !isNaN(value)) {
          return TAU * (Math.abs(value) / total);
        }
        return 0;
      }
      getLabelAndValue(index) {
        const meta = this._cachedMeta;
        const chart = this.chart;
        const labels = chart.data.labels || [];
        const value = formatNumber(meta._parsed[index], chart.options.locale);
        return {
          label: labels[index] || '',
          value,
        };
      }
      getMaxBorderWidth(arcs) {
        let max = 0;
        const chart = this.chart;
        let i, ilen, meta, controller, options;
        if (!arcs) {
          for (i = 0, ilen = chart.data.datasets.length; i < ilen; ++i) {
            if (chart.isDatasetVisible(i)) {
              meta = chart.getDatasetMeta(i);
              arcs = meta.data;
              controller = meta.controller;
              if (controller !== this) {
                controller.configure();
              }
              break;
            }
          }
        }
        if (!arcs) {
          return 0;
        }
        for (i = 0, ilen = arcs.length; i < ilen; ++i) {
          options = controller.resolveDataElementOptions(i);
          if (options.borderAlign !== 'inner') {
            max = Math.max(max, options.borderWidth || 0, options.hoverBorderWidth || 0);
          }
        }
        return max;
      }
      getMaxOffset(arcs) {
        let max = 0;
        for (let i = 0, ilen = arcs.length; i < ilen; ++i) {
          const options = this.resolveDataElementOptions(i);
          max = Math.max(max, options.offset || 0, options.hoverOffset || 0);
        }
        return max;
      }
      _getRingWeightOffset(datasetIndex) {
        let ringWeightOffset = 0;
        for (let i = 0; i < datasetIndex; ++i) {
          if (this.chart.isDatasetVisible(i)) {
            ringWeightOffset += this._getRingWeight(i);
          }
        }
        return ringWeightOffset;
      }
      _getRingWeight(datasetIndex) {
        return Math.max(valueOrDefault(this.chart.data.datasets[datasetIndex].weight, 1), 0);
      }
      _getVisibleDatasetWeightTotal() {
        return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
      }
    }
    DoughnutController.id = 'doughnut';
    DoughnutController.defaults = {
      datasetElementType: false,
      dataElementType: 'arc',
      animation: {
        animateRotate: true,
        animateScale: false
      },
      animations: {
        numbers: {
          type: 'number',
          properties: ['circumference', 'endAngle', 'innerRadius', 'outerRadius', 'startAngle', 'x', 'y', 'offset', 'borderWidth', 'spacing']
        },
      },
      cutout: '50%',
      rotation: 0,
      circumference: 360,
      radius: '100%',
      spacing: 0,
      indexAxis: 'r',
    };
    DoughnutController.descriptors = {
      _scriptable: (name) => name !== 'spacing',
      _indexable: (name) => name !== 'spacing',
    };
    DoughnutController.overrides = {
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            generateLabels(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                const {labels: {pointStyle}} = chart.legend.options;
                return data.labels.map((label, i) => {
                  const meta = chart.getDatasetMeta(0);
                  const style = meta.controller.getStyle(i);
                  return {
                    text: label,
                    fillStyle: style.backgroundColor,
                    strokeStyle: style.borderColor,
                    lineWidth: style.borderWidth,
                    pointStyle: pointStyle,
                    hidden: !chart.getDataVisibility(i),
                    index: i
                  };
                });
              }
              return [];
            }
          },
          onClick(e, legendItem, legend) {
            legend.chart.toggleDataVisibility(legendItem.index);
            legend.chart.update();
          }
        },
        tooltip: {
          callbacks: {
            title() {
              return '';
            },
            label(tooltipItem) {
              let dataLabel = tooltipItem.label;
              const value = ': ' + tooltipItem.formattedValue;
              if (isArray(dataLabel)) {
                dataLabel = dataLabel.slice();
                dataLabel[0] += value;
              } else {
                dataLabel += value;
              }
              return dataLabel;
            }
          }
        }
      }
    };

    class LineController extends DatasetController {
      initialize() {
        this.enableOptionSharing = true;
        super.initialize();
      }
      update(mode) {
        const meta = this._cachedMeta;
        const {dataset: line, data: points = [], _dataset} = meta;
        const animationsDisabled = this.chart._animationsDisabled;
        let {start, count} = getStartAndCountOfVisiblePoints(meta, points, animationsDisabled);
        this._drawStart = start;
        this._drawCount = count;
        if (scaleRangesChanged(meta)) {
          start = 0;
          count = points.length;
        }
        line._chart = this.chart;
        line._datasetIndex = this.index;
        line._decimated = !!_dataset._decimated;
        line.points = points;
        const options = this.resolveDatasetElementOptions(mode);
        if (!this.options.showLine) {
          options.borderWidth = 0;
        }
        options.segment = this.options.segment;
        this.updateElement(line, undefined, {
          animated: !animationsDisabled,
          options
        }, mode);
        this.updateElements(points, start, count, mode);
      }
      updateElements(points, start, count, mode) {
        const reset = mode === 'reset';
        const {iScale, vScale, _stacked, _dataset} = this._cachedMeta;
        const firstOpts = this.resolveDataElementOptions(start, mode);
        const sharedOptions = this.getSharedOptions(firstOpts);
        const includeOptions = this.includeOptions(mode, sharedOptions);
        const iAxis = iScale.axis;
        const vAxis = vScale.axis;
        const {spanGaps, segment} = this.options;
        const maxGapLength = isNumber(spanGaps) ? spanGaps : Number.POSITIVE_INFINITY;
        const directUpdate = this.chart._animationsDisabled || reset || mode === 'none';
        let prevParsed = start > 0 && this.getParsed(start - 1);
        for (let i = start; i < start + count; ++i) {
          const point = points[i];
          const parsed = this.getParsed(i);
          const properties = directUpdate ? point : {};
          const nullData = isNullOrUndef(parsed[vAxis]);
          const iPixel = properties[iAxis] = iScale.getPixelForValue(parsed[iAxis], i);
          const vPixel = properties[vAxis] = reset || nullData ? vScale.getBasePixel() : vScale.getPixelForValue(_stacked ? this.applyStack(vScale, parsed, _stacked) : parsed[vAxis], i);
          properties.skip = isNaN(iPixel) || isNaN(vPixel) || nullData;
          properties.stop = i > 0 && (parsed[iAxis] - prevParsed[iAxis]) > maxGapLength;
          if (segment) {
            properties.parsed = parsed;
            properties.raw = _dataset.data[i];
          }
          if (includeOptions) {
            properties.options = sharedOptions || this.resolveDataElementOptions(i, point.active ? 'active' : mode);
          }
          if (!directUpdate) {
            this.updateElement(point, i, properties, mode);
          }
          prevParsed = parsed;
        }
        this.updateSharedOptions(sharedOptions, mode, firstOpts);
      }
      getMaxOverflow() {
        const meta = this._cachedMeta;
        const dataset = meta.dataset;
        const border = dataset.options && dataset.options.borderWidth || 0;
        const data = meta.data || [];
        if (!data.length) {
          return border;
        }
        const firstPoint = data[0].size(this.resolveDataElementOptions(0));
        const lastPoint = data[data.length - 1].size(this.resolveDataElementOptions(data.length - 1));
        return Math.max(border, firstPoint, lastPoint) / 2;
      }
      draw() {
        const meta = this._cachedMeta;
        meta.dataset.updateControlPoints(this.chart.chartArea, meta.iScale.axis);
        super.draw();
      }
    }
    LineController.id = 'line';
    LineController.defaults = {
      datasetElementType: 'line',
      dataElementType: 'point',
      showLine: true,
      spanGaps: false,
    };
    LineController.overrides = {
      scales: {
        _index_: {
          type: 'category',
        },
        _value_: {
          type: 'linear',
        },
      }
    };
    function getStartAndCountOfVisiblePoints(meta, points, animationsDisabled) {
      const pointCount = points.length;
      let start = 0;
      let count = pointCount;
      if (meta._sorted) {
        const {iScale, _parsed} = meta;
        const axis = iScale.axis;
        const {min, max, minDefined, maxDefined} = iScale.getUserBounds();
        if (minDefined) {
          start = _limitValue(Math.min(
            _lookupByKey(_parsed, iScale.axis, min).lo,
            animationsDisabled ? pointCount : _lookupByKey(points, axis, iScale.getPixelForValue(min)).lo),
          0, pointCount - 1);
        }
        if (maxDefined) {
          count = _limitValue(Math.max(
            _lookupByKey(_parsed, iScale.axis, max).hi + 1,
            animationsDisabled ? 0 : _lookupByKey(points, axis, iScale.getPixelForValue(max)).hi + 1),
          start, pointCount) - start;
        } else {
          count = pointCount - start;
        }
      }
      return {start, count};
    }
    function scaleRangesChanged(meta) {
      const {xScale, yScale, _scaleRanges} = meta;
      const newRanges = {
        xmin: xScale.min,
        xmax: xScale.max,
        ymin: yScale.min,
        ymax: yScale.max
      };
      if (!_scaleRanges) {
        meta._scaleRanges = newRanges;
        return true;
      }
      const changed = _scaleRanges.xmin !== xScale.min
    		|| _scaleRanges.xmax !== xScale.max
    		|| _scaleRanges.ymin !== yScale.min
    		|| _scaleRanges.ymax !== yScale.max;
      Object.assign(_scaleRanges, newRanges);
      return changed;
    }

    class PolarAreaController extends DatasetController {
      constructor(chart, datasetIndex) {
        super(chart, datasetIndex);
        this.innerRadius = undefined;
        this.outerRadius = undefined;
      }
      getLabelAndValue(index) {
        const meta = this._cachedMeta;
        const chart = this.chart;
        const labels = chart.data.labels || [];
        const value = formatNumber(meta._parsed[index].r, chart.options.locale);
        return {
          label: labels[index] || '',
          value,
        };
      }
      update(mode) {
        const arcs = this._cachedMeta.data;
        this._updateRadius();
        this.updateElements(arcs, 0, arcs.length, mode);
      }
      _updateRadius() {
        const chart = this.chart;
        const chartArea = chart.chartArea;
        const opts = chart.options;
        const minSize = Math.min(chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
        const outerRadius = Math.max(minSize / 2, 0);
        const innerRadius = Math.max(opts.cutoutPercentage ? (outerRadius / 100) * (opts.cutoutPercentage) : 1, 0);
        const radiusLength = (outerRadius - innerRadius) / chart.getVisibleDatasetCount();
        this.outerRadius = outerRadius - (radiusLength * this.index);
        this.innerRadius = this.outerRadius - radiusLength;
      }
      updateElements(arcs, start, count, mode) {
        const reset = mode === 'reset';
        const chart = this.chart;
        const dataset = this.getDataset();
        const opts = chart.options;
        const animationOpts = opts.animation;
        const scale = this._cachedMeta.rScale;
        const centerX = scale.xCenter;
        const centerY = scale.yCenter;
        const datasetStartAngle = scale.getIndexAngle(0) - 0.5 * PI;
        let angle = datasetStartAngle;
        let i;
        const defaultAngle = 360 / this.countVisibleElements();
        for (i = 0; i < start; ++i) {
          angle += this._computeAngle(i, mode, defaultAngle);
        }
        for (i = start; i < start + count; i++) {
          const arc = arcs[i];
          let startAngle = angle;
          let endAngle = angle + this._computeAngle(i, mode, defaultAngle);
          let outerRadius = chart.getDataVisibility(i) ? scale.getDistanceFromCenterForValue(dataset.data[i]) : 0;
          angle = endAngle;
          if (reset) {
            if (animationOpts.animateScale) {
              outerRadius = 0;
            }
            if (animationOpts.animateRotate) {
              startAngle = endAngle = datasetStartAngle;
            }
          }
          const properties = {
            x: centerX,
            y: centerY,
            innerRadius: 0,
            outerRadius,
            startAngle,
            endAngle,
            options: this.resolveDataElementOptions(i, arc.active ? 'active' : mode)
          };
          this.updateElement(arc, i, properties, mode);
        }
      }
      countVisibleElements() {
        const dataset = this.getDataset();
        const meta = this._cachedMeta;
        let count = 0;
        meta.data.forEach((element, index) => {
          if (!isNaN(dataset.data[index]) && this.chart.getDataVisibility(index)) {
            count++;
          }
        });
        return count;
      }
      _computeAngle(index, mode, defaultAngle) {
        return this.chart.getDataVisibility(index)
          ? toRadians(this.resolveDataElementOptions(index, mode).angle || defaultAngle)
          : 0;
      }
    }
    PolarAreaController.id = 'polarArea';
    PolarAreaController.defaults = {
      dataElementType: 'arc',
      animation: {
        animateRotate: true,
        animateScale: true
      },
      animations: {
        numbers: {
          type: 'number',
          properties: ['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius']
        },
      },
      indexAxis: 'r',
      startAngle: 0,
    };
    PolarAreaController.overrides = {
      aspectRatio: 1,
      plugins: {
        legend: {
          labels: {
            generateLabels(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                const {labels: {pointStyle}} = chart.legend.options;
                return data.labels.map((label, i) => {
                  const meta = chart.getDatasetMeta(0);
                  const style = meta.controller.getStyle(i);
                  return {
                    text: label,
                    fillStyle: style.backgroundColor,
                    strokeStyle: style.borderColor,
                    lineWidth: style.borderWidth,
                    pointStyle: pointStyle,
                    hidden: !chart.getDataVisibility(i),
                    index: i
                  };
                });
              }
              return [];
            }
          },
          onClick(e, legendItem, legend) {
            legend.chart.toggleDataVisibility(legendItem.index);
            legend.chart.update();
          }
        },
        tooltip: {
          callbacks: {
            title() {
              return '';
            },
            label(context) {
              return context.chart.data.labels[context.dataIndex] + ': ' + context.formattedValue;
            }
          }
        }
      },
      scales: {
        r: {
          type: 'radialLinear',
          angleLines: {
            display: false
          },
          beginAtZero: true,
          grid: {
            circular: true
          },
          pointLabels: {
            display: false
          },
          startAngle: 0
        }
      }
    };

    class PieController extends DoughnutController {
    }
    PieController.id = 'pie';
    PieController.defaults = {
      cutout: 0,
      rotation: 0,
      circumference: 360,
      radius: '100%'
    };

    class RadarController extends DatasetController {
      getLabelAndValue(index) {
        const vScale = this._cachedMeta.vScale;
        const parsed = this.getParsed(index);
        return {
          label: vScale.getLabels()[index],
          value: '' + vScale.getLabelForValue(parsed[vScale.axis])
        };
      }
      update(mode) {
        const meta = this._cachedMeta;
        const line = meta.dataset;
        const points = meta.data || [];
        const labels = meta.iScale.getLabels();
        line.points = points;
        if (mode !== 'resize') {
          const options = this.resolveDatasetElementOptions(mode);
          if (!this.options.showLine) {
            options.borderWidth = 0;
          }
          const properties = {
            _loop: true,
            _fullLoop: labels.length === points.length,
            options
          };
          this.updateElement(line, undefined, properties, mode);
        }
        this.updateElements(points, 0, points.length, mode);
      }
      updateElements(points, start, count, mode) {
        const dataset = this.getDataset();
        const scale = this._cachedMeta.rScale;
        const reset = mode === 'reset';
        for (let i = start; i < start + count; i++) {
          const point = points[i];
          const options = this.resolveDataElementOptions(i, point.active ? 'active' : mode);
          const pointPosition = scale.getPointPositionForValue(i, dataset.data[i]);
          const x = reset ? scale.xCenter : pointPosition.x;
          const y = reset ? scale.yCenter : pointPosition.y;
          const properties = {
            x,
            y,
            angle: pointPosition.angle,
            skip: isNaN(x) || isNaN(y),
            options
          };
          this.updateElement(point, i, properties, mode);
        }
      }
    }
    RadarController.id = 'radar';
    RadarController.defaults = {
      datasetElementType: 'line',
      dataElementType: 'point',
      indexAxis: 'r',
      showLine: true,
      elements: {
        line: {
          fill: 'start'
        }
      },
    };
    RadarController.overrides = {
      aspectRatio: 1,
      scales: {
        r: {
          type: 'radialLinear',
        }
      }
    };

    class ScatterController extends LineController {
    }
    ScatterController.id = 'scatter';
    ScatterController.defaults = {
      showLine: false,
      fill: false
    };
    ScatterController.overrides = {
      interaction: {
        mode: 'point'
      },
      plugins: {
        tooltip: {
          callbacks: {
            title() {
              return '';
            },
            label(item) {
              return '(' + item.label + ', ' + item.formattedValue + ')';
            }
          }
        }
      },
      scales: {
        x: {
          type: 'linear'
        },
        y: {
          type: 'linear'
        }
      }
    };

    var controllers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    BarController: BarController,
    BubbleController: BubbleController,
    DoughnutController: DoughnutController,
    LineController: LineController,
    PolarAreaController: PolarAreaController,
    PieController: PieController,
    RadarController: RadarController,
    ScatterController: ScatterController
    });

    function abstract() {
      throw new Error('This method is not implemented: Check that a complete date adapter is provided.');
    }
    class DateAdapter {
      constructor(options) {
        this.options = options || {};
      }
      formats() {
        return abstract();
      }
      parse(value, format) {
        return abstract();
      }
      format(timestamp, format) {
        return abstract();
      }
      add(timestamp, amount, unit) {
        return abstract();
      }
      diff(a, b, unit) {
        return abstract();
      }
      startOf(timestamp, unit, weekday) {
        return abstract();
      }
      endOf(timestamp, unit) {
        return abstract();
      }
    }
    DateAdapter.override = function(members) {
      Object.assign(DateAdapter.prototype, members);
    };
    var adapters = {
      _date: DateAdapter
    };

    function getRelativePosition(e, chart) {
      if ('native' in e) {
        return {
          x: e.x,
          y: e.y
        };
      }
      return getRelativePosition$1(e, chart);
    }
    function evaluateAllVisibleItems(chart, handler) {
      const metasets = chart.getSortedVisibleDatasetMetas();
      let index, data, element;
      for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
        ({index, data} = metasets[i]);
        for (let j = 0, jlen = data.length; j < jlen; ++j) {
          element = data[j];
          if (!element.skip) {
            handler(element, index, j);
          }
        }
      }
    }
    function binarySearch(metaset, axis, value, intersect) {
      const {controller, data, _sorted} = metaset;
      const iScale = controller._cachedMeta.iScale;
      if (iScale && axis === iScale.axis && _sorted && data.length) {
        const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
        if (!intersect) {
          return lookupMethod(data, axis, value);
        } else if (controller._sharedOptions) {
          const el = data[0];
          const range = typeof el.getRange === 'function' && el.getRange(axis);
          if (range) {
            const start = lookupMethod(data, axis, value - range);
            const end = lookupMethod(data, axis, value + range);
            return {lo: start.lo, hi: end.hi};
          }
        }
      }
      return {lo: 0, hi: data.length - 1};
    }
    function optimizedEvaluateItems(chart, axis, position, handler, intersect) {
      const metasets = chart.getSortedVisibleDatasetMetas();
      const value = position[axis];
      for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
        const {index, data} = metasets[i];
        const {lo, hi} = binarySearch(metasets[i], axis, value, intersect);
        for (let j = lo; j <= hi; ++j) {
          const element = data[j];
          if (!element.skip) {
            handler(element, index, j);
          }
        }
      }
    }
    function getDistanceMetricForAxis(axis) {
      const useX = axis.indexOf('x') !== -1;
      const useY = axis.indexOf('y') !== -1;
      return function(pt1, pt2) {
        const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
        const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
        return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
      };
    }
    function getIntersectItems(chart, position, axis, useFinalPosition) {
      const items = [];
      if (!_isPointInArea(position, chart.chartArea, chart._minPadding)) {
        return items;
      }
      const evaluationFunc = function(element, datasetIndex, index) {
        if (element.inRange(position.x, position.y, useFinalPosition)) {
          items.push({element, datasetIndex, index});
        }
      };
      optimizedEvaluateItems(chart, axis, position, evaluationFunc, true);
      return items;
    }
    function getNearestItems(chart, position, axis, intersect, useFinalPosition) {
      const distanceMetric = getDistanceMetricForAxis(axis);
      let minDistance = Number.POSITIVE_INFINITY;
      let items = [];
      if (!_isPointInArea(position, chart.chartArea, chart._minPadding)) {
        return items;
      }
      const evaluationFunc = function(element, datasetIndex, index) {
        if (intersect && !element.inRange(position.x, position.y, useFinalPosition)) {
          return;
        }
        const center = element.getCenterPoint(useFinalPosition);
        if (!_isPointInArea(center, chart.chartArea, chart._minPadding) && !element.inRange(position.x, position.y, useFinalPosition)) {
          return;
        }
        const distance = distanceMetric(position, center);
        if (distance < minDistance) {
          items = [{element, datasetIndex, index}];
          minDistance = distance;
        } else if (distance === minDistance) {
          items.push({element, datasetIndex, index});
        }
      };
      optimizedEvaluateItems(chart, axis, position, evaluationFunc);
      return items;
    }
    function getAxisItems(chart, e, options, useFinalPosition) {
      const position = getRelativePosition(e, chart);
      const items = [];
      const axis = options.axis;
      const rangeMethod = axis === 'x' ? 'inXRange' : 'inYRange';
      let intersectsItem = false;
      evaluateAllVisibleItems(chart, (element, datasetIndex, index) => {
        if (element[rangeMethod](position[axis], useFinalPosition)) {
          items.push({element, datasetIndex, index});
        }
        if (element.inRange(position.x, position.y, useFinalPosition)) {
          intersectsItem = true;
        }
      });
      if (options.intersect && !intersectsItem) {
        return [];
      }
      return items;
    }
    var Interaction = {
      modes: {
        index(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || 'x';
          const items = options.intersect
            ? getIntersectItems(chart, position, axis, useFinalPosition)
            : getNearestItems(chart, position, axis, false, useFinalPosition);
          const elements = [];
          if (!items.length) {
            return [];
          }
          chart.getSortedVisibleDatasetMetas().forEach((meta) => {
            const index = items[0].index;
            const element = meta.data[index];
            if (element && !element.skip) {
              elements.push({element, datasetIndex: meta.index, index});
            }
          });
          return elements;
        },
        dataset(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || 'xy';
          let items = options.intersect
            ? getIntersectItems(chart, position, axis, useFinalPosition) :
            getNearestItems(chart, position, axis, false, useFinalPosition);
          if (items.length > 0) {
            const datasetIndex = items[0].datasetIndex;
            const data = chart.getDatasetMeta(datasetIndex).data;
            items = [];
            for (let i = 0; i < data.length; ++i) {
              items.push({element: data[i], datasetIndex, index: i});
            }
          }
          return items;
        },
        point(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || 'xy';
          return getIntersectItems(chart, position, axis, useFinalPosition);
        },
        nearest(chart, e, options, useFinalPosition) {
          const position = getRelativePosition(e, chart);
          const axis = options.axis || 'xy';
          return getNearestItems(chart, position, axis, options.intersect, useFinalPosition);
        },
        x(chart, e, options, useFinalPosition) {
          options.axis = 'x';
          return getAxisItems(chart, e, options, useFinalPosition);
        },
        y(chart, e, options, useFinalPosition) {
          options.axis = 'y';
          return getAxisItems(chart, e, options, useFinalPosition);
        }
      }
    };

    const STATIC_POSITIONS = ['left', 'top', 'right', 'bottom'];
    function filterByPosition(array, position) {
      return array.filter(v => v.pos === position);
    }
    function filterDynamicPositionByAxis(array, axis) {
      return array.filter(v => STATIC_POSITIONS.indexOf(v.pos) === -1 && v.box.axis === axis);
    }
    function sortByWeight(array, reverse) {
      return array.sort((a, b) => {
        const v0 = reverse ? b : a;
        const v1 = reverse ? a : b;
        return v0.weight === v1.weight ?
          v0.index - v1.index :
          v0.weight - v1.weight;
      });
    }
    function wrapBoxes(boxes) {
      const layoutBoxes = [];
      let i, ilen, box, pos, stack, stackWeight;
      for (i = 0, ilen = (boxes || []).length; i < ilen; ++i) {
        box = boxes[i];
        ({position: pos, options: {stack, stackWeight = 1}} = box);
        layoutBoxes.push({
          index: i,
          box,
          pos,
          horizontal: box.isHorizontal(),
          weight: box.weight,
          stack: stack && (pos + stack),
          stackWeight
        });
      }
      return layoutBoxes;
    }
    function buildStacks(layouts) {
      const stacks = {};
      for (const wrap of layouts) {
        const {stack, pos, stackWeight} = wrap;
        if (!stack || !STATIC_POSITIONS.includes(pos)) {
          continue;
        }
        const _stack = stacks[stack] || (stacks[stack] = {count: 0, placed: 0, weight: 0, size: 0});
        _stack.count++;
        _stack.weight += stackWeight;
      }
      return stacks;
    }
    function setLayoutDims(layouts, params) {
      const stacks = buildStacks(layouts);
      const {vBoxMaxWidth, hBoxMaxHeight} = params;
      let i, ilen, layout;
      for (i = 0, ilen = layouts.length; i < ilen; ++i) {
        layout = layouts[i];
        const {fullSize} = layout.box;
        const stack = stacks[layout.stack];
        const factor = stack && layout.stackWeight / stack.weight;
        if (layout.horizontal) {
          layout.width = factor ? factor * vBoxMaxWidth : fullSize && params.availableWidth;
          layout.height = hBoxMaxHeight;
        } else {
          layout.width = vBoxMaxWidth;
          layout.height = factor ? factor * hBoxMaxHeight : fullSize && params.availableHeight;
        }
      }
      return stacks;
    }
    function buildLayoutBoxes(boxes) {
      const layoutBoxes = wrapBoxes(boxes);
      const fullSize = sortByWeight(layoutBoxes.filter(wrap => wrap.box.fullSize), true);
      const left = sortByWeight(filterByPosition(layoutBoxes, 'left'), true);
      const right = sortByWeight(filterByPosition(layoutBoxes, 'right'));
      const top = sortByWeight(filterByPosition(layoutBoxes, 'top'), true);
      const bottom = sortByWeight(filterByPosition(layoutBoxes, 'bottom'));
      const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, 'x');
      const centerVertical = filterDynamicPositionByAxis(layoutBoxes, 'y');
      return {
        fullSize,
        leftAndTop: left.concat(top),
        rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
        chartArea: filterByPosition(layoutBoxes, 'chartArea'),
        vertical: left.concat(right).concat(centerVertical),
        horizontal: top.concat(bottom).concat(centerHorizontal)
      };
    }
    function getCombinedMax(maxPadding, chartArea, a, b) {
      return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
    }
    function updateMaxPadding(maxPadding, boxPadding) {
      maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
      maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
      maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
      maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
    }
    function updateDims(chartArea, params, layout, stacks) {
      const {pos, box} = layout;
      const maxPadding = chartArea.maxPadding;
      if (!isObject(pos)) {
        if (layout.size) {
          chartArea[pos] -= layout.size;
        }
        const stack = stacks[layout.stack] || {size: 0, count: 1};
        stack.size = Math.max(stack.size, layout.horizontal ? box.height : box.width);
        layout.size = stack.size / stack.count;
        chartArea[pos] += layout.size;
      }
      if (box.getPadding) {
        updateMaxPadding(maxPadding, box.getPadding());
      }
      const newWidth = Math.max(0, params.outerWidth - getCombinedMax(maxPadding, chartArea, 'left', 'right'));
      const newHeight = Math.max(0, params.outerHeight - getCombinedMax(maxPadding, chartArea, 'top', 'bottom'));
      const widthChanged = newWidth !== chartArea.w;
      const heightChanged = newHeight !== chartArea.h;
      chartArea.w = newWidth;
      chartArea.h = newHeight;
      return layout.horizontal
        ? {same: widthChanged, other: heightChanged}
        : {same: heightChanged, other: widthChanged};
    }
    function handleMaxPadding(chartArea) {
      const maxPadding = chartArea.maxPadding;
      function updatePos(pos) {
        const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
        chartArea[pos] += change;
        return change;
      }
      chartArea.y += updatePos('top');
      chartArea.x += updatePos('left');
      updatePos('right');
      updatePos('bottom');
    }
    function getMargins(horizontal, chartArea) {
      const maxPadding = chartArea.maxPadding;
      function marginForPositions(positions) {
        const margin = {left: 0, top: 0, right: 0, bottom: 0};
        positions.forEach((pos) => {
          margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
        });
        return margin;
      }
      return horizontal
        ? marginForPositions(['left', 'right'])
        : marginForPositions(['top', 'bottom']);
    }
    function fitBoxes(boxes, chartArea, params, stacks) {
      const refitBoxes = [];
      let i, ilen, layout, box, refit, changed;
      for (i = 0, ilen = boxes.length, refit = 0; i < ilen; ++i) {
        layout = boxes[i];
        box = layout.box;
        box.update(
          layout.width || chartArea.w,
          layout.height || chartArea.h,
          getMargins(layout.horizontal, chartArea)
        );
        const {same, other} = updateDims(chartArea, params, layout, stacks);
        refit |= same && refitBoxes.length;
        changed = changed || other;
        if (!box.fullSize) {
          refitBoxes.push(layout);
        }
      }
      return refit && fitBoxes(refitBoxes, chartArea, params, stacks) || changed;
    }
    function setBoxDims(box, left, top, width, height) {
      box.top = top;
      box.left = left;
      box.right = left + width;
      box.bottom = top + height;
      box.width = width;
      box.height = height;
    }
    function placeBoxes(boxes, chartArea, params, stacks) {
      const userPadding = params.padding;
      let {x, y} = chartArea;
      for (const layout of boxes) {
        const box = layout.box;
        const stack = stacks[layout.stack] || {count: 1, placed: 0, weight: 1};
        const weight = (layout.stackWeight / stack.weight) || 1;
        if (layout.horizontal) {
          const width = chartArea.w * weight;
          const height = stack.size || box.height;
          if (defined(stack.start)) {
            y = stack.start;
          }
          if (box.fullSize) {
            setBoxDims(box, userPadding.left, y, params.outerWidth - userPadding.right - userPadding.left, height);
          } else {
            setBoxDims(box, chartArea.left + stack.placed, y, width, height);
          }
          stack.start = y;
          stack.placed += width;
          y = box.bottom;
        } else {
          const height = chartArea.h * weight;
          const width = stack.size || box.width;
          if (defined(stack.start)) {
            x = stack.start;
          }
          if (box.fullSize) {
            setBoxDims(box, x, userPadding.top, width, params.outerHeight - userPadding.bottom - userPadding.top);
          } else {
            setBoxDims(box, x, chartArea.top + stack.placed, width, height);
          }
          stack.start = x;
          stack.placed += height;
          x = box.right;
        }
      }
      chartArea.x = x;
      chartArea.y = y;
    }
    defaults.set('layout', {
      autoPadding: true,
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }
    });
    var layouts = {
      addBox(chart, item) {
        if (!chart.boxes) {
          chart.boxes = [];
        }
        item.fullSize = item.fullSize || false;
        item.position = item.position || 'top';
        item.weight = item.weight || 0;
        item._layers = item._layers || function() {
          return [{
            z: 0,
            draw(chartArea) {
              item.draw(chartArea);
            }
          }];
        };
        chart.boxes.push(item);
      },
      removeBox(chart, layoutItem) {
        const index = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
        if (index !== -1) {
          chart.boxes.splice(index, 1);
        }
      },
      configure(chart, item, options) {
        item.fullSize = options.fullSize;
        item.position = options.position;
        item.weight = options.weight;
      },
      update(chart, width, height, minPadding) {
        if (!chart) {
          return;
        }
        const padding = toPadding(chart.options.layout.padding);
        const availableWidth = Math.max(width - padding.width, 0);
        const availableHeight = Math.max(height - padding.height, 0);
        const boxes = buildLayoutBoxes(chart.boxes);
        const verticalBoxes = boxes.vertical;
        const horizontalBoxes = boxes.horizontal;
        each(chart.boxes, box => {
          if (typeof box.beforeLayout === 'function') {
            box.beforeLayout();
          }
        });
        const visibleVerticalBoxCount = verticalBoxes.reduce((total, wrap) =>
          wrap.box.options && wrap.box.options.display === false ? total : total + 1, 0) || 1;
        const params = Object.freeze({
          outerWidth: width,
          outerHeight: height,
          padding,
          availableWidth,
          availableHeight,
          vBoxMaxWidth: availableWidth / 2 / visibleVerticalBoxCount,
          hBoxMaxHeight: availableHeight / 2
        });
        const maxPadding = Object.assign({}, padding);
        updateMaxPadding(maxPadding, toPadding(minPadding));
        const chartArea = Object.assign({
          maxPadding,
          w: availableWidth,
          h: availableHeight,
          x: padding.left,
          y: padding.top
        }, padding);
        const stacks = setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
        fitBoxes(boxes.fullSize, chartArea, params, stacks);
        fitBoxes(verticalBoxes, chartArea, params, stacks);
        if (fitBoxes(horizontalBoxes, chartArea, params, stacks)) {
          fitBoxes(verticalBoxes, chartArea, params, stacks);
        }
        handleMaxPadding(chartArea);
        placeBoxes(boxes.leftAndTop, chartArea, params, stacks);
        chartArea.x += chartArea.w;
        chartArea.y += chartArea.h;
        placeBoxes(boxes.rightAndBottom, chartArea, params, stacks);
        chart.chartArea = {
          left: chartArea.left,
          top: chartArea.top,
          right: chartArea.left + chartArea.w,
          bottom: chartArea.top + chartArea.h,
          height: chartArea.h,
          width: chartArea.w,
        };
        each(boxes.chartArea, (layout) => {
          const box = layout.box;
          Object.assign(box, chart.chartArea);
          box.update(chartArea.w, chartArea.h);
        });
      }
    };

    class BasePlatform {
      acquireContext(canvas, aspectRatio) {}
      releaseContext(context) {
        return false;
      }
      addEventListener(chart, type, listener) {}
      removeEventListener(chart, type, listener) {}
      getDevicePixelRatio() {
        return 1;
      }
      getMaximumSize(element, width, height, aspectRatio) {
        width = Math.max(0, width || element.width);
        height = height || element.height;
        return {
          width,
          height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
        };
      }
      isAttached(canvas) {
        return true;
      }
      updateConfig(config) {
      }
    }

    class BasicPlatform extends BasePlatform {
      acquireContext(item) {
        return item && item.getContext && item.getContext('2d') || null;
      }
      updateConfig(config) {
        config.options.animation = false;
      }
    }

    const EXPANDO_KEY = '$chartjs';
    const EVENT_TYPES = {
      touchstart: 'mousedown',
      touchmove: 'mousemove',
      touchend: 'mouseup',
      pointerenter: 'mouseenter',
      pointerdown: 'mousedown',
      pointermove: 'mousemove',
      pointerup: 'mouseup',
      pointerleave: 'mouseout',
      pointerout: 'mouseout'
    };
    const isNullOrEmpty = value => value === null || value === '';
    function initCanvas(canvas, aspectRatio) {
      const style = canvas.style;
      const renderHeight = canvas.getAttribute('height');
      const renderWidth = canvas.getAttribute('width');
      canvas[EXPANDO_KEY] = {
        initial: {
          height: renderHeight,
          width: renderWidth,
          style: {
            display: style.display,
            height: style.height,
            width: style.width
          }
        }
      };
      style.display = style.display || 'block';
      style.boxSizing = style.boxSizing || 'border-box';
      if (isNullOrEmpty(renderWidth)) {
        const displayWidth = readUsedSize(canvas, 'width');
        if (displayWidth !== undefined) {
          canvas.width = displayWidth;
        }
      }
      if (isNullOrEmpty(renderHeight)) {
        if (canvas.style.height === '') {
          canvas.height = canvas.width / (aspectRatio || 2);
        } else {
          const displayHeight = readUsedSize(canvas, 'height');
          if (displayHeight !== undefined) {
            canvas.height = displayHeight;
          }
        }
      }
      return canvas;
    }
    const eventListenerOptions = supportsEventListenerOptions ? {passive: true} : false;
    function addListener(node, type, listener) {
      node.addEventListener(type, listener, eventListenerOptions);
    }
    function removeListener(chart, type, listener) {
      chart.canvas.removeEventListener(type, listener, eventListenerOptions);
    }
    function fromNativeEvent(event, chart) {
      const type = EVENT_TYPES[event.type] || event.type;
      const {x, y} = getRelativePosition$1(event, chart);
      return {
        type,
        chart,
        native: event,
        x: x !== undefined ? x : null,
        y: y !== undefined ? y : null,
      };
    }
    function createAttachObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const observer = new MutationObserver(entries => {
        for (const entry of entries) {
          for (const node of entry.addedNodes) {
            if (node === canvas || node.contains(canvas)) {
              return listener();
            }
          }
        }
      });
      observer.observe(document, {childList: true, subtree: true});
      return observer;
    }
    function createDetachObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const observer = new MutationObserver(entries => {
        for (const entry of entries) {
          for (const node of entry.removedNodes) {
            if (node === canvas || node.contains(canvas)) {
              return listener();
            }
          }
        }
      });
      observer.observe(document, {childList: true, subtree: true});
      return observer;
    }
    const drpListeningCharts = new Map();
    let oldDevicePixelRatio = 0;
    function onWindowResize() {
      const dpr = window.devicePixelRatio;
      if (dpr === oldDevicePixelRatio) {
        return;
      }
      oldDevicePixelRatio = dpr;
      drpListeningCharts.forEach((resize, chart) => {
        if (chart.currentDevicePixelRatio !== dpr) {
          resize();
        }
      });
    }
    function listenDevicePixelRatioChanges(chart, resize) {
      if (!drpListeningCharts.size) {
        window.addEventListener('resize', onWindowResize);
      }
      drpListeningCharts.set(chart, resize);
    }
    function unlistenDevicePixelRatioChanges(chart) {
      drpListeningCharts.delete(chart);
      if (!drpListeningCharts.size) {
        window.removeEventListener('resize', onWindowResize);
      }
    }
    function createResizeObserver(chart, type, listener) {
      const canvas = chart.canvas;
      const container = canvas && _getParentNode(canvas);
      if (!container) {
        return;
      }
      const resize = throttled((width, height) => {
        const w = container.clientWidth;
        listener(width, height);
        if (w < container.clientWidth) {
          listener();
        }
      }, window);
      const observer = new ResizeObserver(entries => {
        const entry = entries[0];
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        if (width === 0 && height === 0) {
          return;
        }
        resize(width, height);
      });
      observer.observe(container);
      listenDevicePixelRatioChanges(chart, resize);
      return observer;
    }
    function releaseObserver(chart, type, observer) {
      if (observer) {
        observer.disconnect();
      }
      if (type === 'resize') {
        unlistenDevicePixelRatioChanges(chart);
      }
    }
    function createProxyAndListen(chart, type, listener) {
      const canvas = chart.canvas;
      const proxy = throttled((event) => {
        if (chart.ctx !== null) {
          listener(fromNativeEvent(event, chart));
        }
      }, chart, (args) => {
        const event = args[0];
        return [event, event.offsetX, event.offsetY];
      });
      addListener(canvas, type, proxy);
      return proxy;
    }
    class DomPlatform extends BasePlatform {
      acquireContext(canvas, aspectRatio) {
        const context = canvas && canvas.getContext && canvas.getContext('2d');
        if (context && context.canvas === canvas) {
          initCanvas(canvas, aspectRatio);
          return context;
        }
        return null;
      }
      releaseContext(context) {
        const canvas = context.canvas;
        if (!canvas[EXPANDO_KEY]) {
          return false;
        }
        const initial = canvas[EXPANDO_KEY].initial;
        ['height', 'width'].forEach((prop) => {
          const value = initial[prop];
          if (isNullOrUndef(value)) {
            canvas.removeAttribute(prop);
          } else {
            canvas.setAttribute(prop, value);
          }
        });
        const style = initial.style || {};
        Object.keys(style).forEach((key) => {
          canvas.style[key] = style[key];
        });
        canvas.width = canvas.width;
        delete canvas[EXPANDO_KEY];
        return true;
      }
      addEventListener(chart, type, listener) {
        this.removeEventListener(chart, type);
        const proxies = chart.$proxies || (chart.$proxies = {});
        const handlers = {
          attach: createAttachObserver,
          detach: createDetachObserver,
          resize: createResizeObserver
        };
        const handler = handlers[type] || createProxyAndListen;
        proxies[type] = handler(chart, type, listener);
      }
      removeEventListener(chart, type) {
        const proxies = chart.$proxies || (chart.$proxies = {});
        const proxy = proxies[type];
        if (!proxy) {
          return;
        }
        const handlers = {
          attach: releaseObserver,
          detach: releaseObserver,
          resize: releaseObserver
        };
        const handler = handlers[type] || removeListener;
        handler(chart, type, proxy);
        proxies[type] = undefined;
      }
      getDevicePixelRatio() {
        return window.devicePixelRatio;
      }
      getMaximumSize(canvas, width, height, aspectRatio) {
        return getMaximumSize(canvas, width, height, aspectRatio);
      }
      isAttached(canvas) {
        const container = _getParentNode(canvas);
        return !!(container && container.isConnected);
      }
    }

    function _detectPlatform(canvas) {
      if (!_isDomSupported() || (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas)) {
        return BasicPlatform;
      }
      return DomPlatform;
    }

    class Element {
      constructor() {
        this.x = undefined;
        this.y = undefined;
        this.active = false;
        this.options = undefined;
        this.$animations = undefined;
      }
      tooltipPosition(useFinalPosition) {
        const {x, y} = this.getProps(['x', 'y'], useFinalPosition);
        return {x, y};
      }
      hasValue() {
        return isNumber(this.x) && isNumber(this.y);
      }
      getProps(props, final) {
        const anims = this.$animations;
        if (!final || !anims) {
          return this;
        }
        const ret = {};
        props.forEach(prop => {
          ret[prop] = anims[prop] && anims[prop].active() ? anims[prop]._to : this[prop];
        });
        return ret;
      }
    }
    Element.defaults = {};
    Element.defaultRoutes = undefined;

    const formatters = {
      values(value) {
        return isArray(value) ? value : '' + value;
      },
      numeric(tickValue, index, ticks) {
        if (tickValue === 0) {
          return '0';
        }
        const locale = this.chart.options.locale;
        let notation;
        let delta = tickValue;
        if (ticks.length > 1) {
          const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
          if (maxTick < 1e-4 || maxTick > 1e+15) {
            notation = 'scientific';
          }
          delta = calculateDelta(tickValue, ticks);
        }
        const logDelta = log10(Math.abs(delta));
        const numDecimal = Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
        const options = {notation, minimumFractionDigits: numDecimal, maximumFractionDigits: numDecimal};
        Object.assign(options, this.options.ticks.format);
        return formatNumber(tickValue, locale, options);
      },
      logarithmic(tickValue, index, ticks) {
        if (tickValue === 0) {
          return '0';
        }
        const remain = tickValue / (Math.pow(10, Math.floor(log10(tickValue))));
        if (remain === 1 || remain === 2 || remain === 5) {
          return formatters.numeric.call(this, tickValue, index, ticks);
        }
        return '';
      }
    };
    function calculateDelta(tickValue, ticks) {
      let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
      if (Math.abs(delta) >= 1 && tickValue !== Math.floor(tickValue)) {
        delta = tickValue - Math.floor(tickValue);
      }
      return delta;
    }
    var Ticks = {formatters};

    defaults.set('scale', {
      display: true,
      offset: false,
      reverse: false,
      beginAtZero: false,
      bounds: 'ticks',
      grace: 0,
      grid: {
        display: true,
        lineWidth: 1,
        drawBorder: true,
        drawOnChartArea: true,
        drawTicks: true,
        tickLength: 8,
        tickWidth: (_ctx, options) => options.lineWidth,
        tickColor: (_ctx, options) => options.color,
        offset: false,
        borderDash: [],
        borderDashOffset: 0.0,
        borderWidth: 1
      },
      title: {
        display: false,
        text: '',
        padding: {
          top: 4,
          bottom: 4
        }
      },
      ticks: {
        minRotation: 0,
        maxRotation: 50,
        mirror: false,
        textStrokeWidth: 0,
        textStrokeColor: '',
        padding: 3,
        display: true,
        autoSkip: true,
        autoSkipPadding: 3,
        labelOffset: 0,
        callback: Ticks.formatters.values,
        minor: {},
        major: {},
        align: 'center',
        crossAlign: 'near',
        showLabelBackdrop: false,
        backdropColor: 'rgba(255, 255, 255, 0.75)',
        backdropPadding: 2,
      }
    });
    defaults.route('scale.ticks', 'color', '', 'color');
    defaults.route('scale.grid', 'color', '', 'borderColor');
    defaults.route('scale.grid', 'borderColor', '', 'borderColor');
    defaults.route('scale.title', 'color', '', 'color');
    defaults.describe('scale', {
      _fallback: false,
      _scriptable: (name) => !name.startsWith('before') && !name.startsWith('after') && name !== 'callback' && name !== 'parser',
      _indexable: (name) => name !== 'borderDash' && name !== 'tickBorderDash',
    });
    defaults.describe('scales', {
      _fallback: 'scale',
    });
    defaults.describe('scale.ticks', {
      _scriptable: (name) => name !== 'backdropPadding' && name !== 'callback',
      _indexable: (name) => name !== 'backdropPadding',
    });

    function autoSkip(scale, ticks) {
      const tickOpts = scale.options.ticks;
      const ticksLimit = tickOpts.maxTicksLimit || determineMaxTicks(scale);
      const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
      const numMajorIndices = majorIndices.length;
      const first = majorIndices[0];
      const last = majorIndices[numMajorIndices - 1];
      const newTicks = [];
      if (numMajorIndices > ticksLimit) {
        skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
        return newTicks;
      }
      const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
      if (numMajorIndices > 0) {
        let i, ilen;
        const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
        skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
        for (i = 0, ilen = numMajorIndices - 1; i < ilen; i++) {
          skip(ticks, newTicks, spacing, majorIndices[i], majorIndices[i + 1]);
        }
        skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
        return newTicks;
      }
      skip(ticks, newTicks, spacing);
      return newTicks;
    }
    function determineMaxTicks(scale) {
      const offset = scale.options.offset;
      const tickLength = scale._tickSize();
      const maxScale = scale._length / tickLength + (offset ? 0 : 1);
      const maxChart = scale._maxLength / tickLength;
      return Math.floor(Math.min(maxScale, maxChart));
    }
    function calculateSpacing(majorIndices, ticks, ticksLimit) {
      const evenMajorSpacing = getEvenSpacing(majorIndices);
      const spacing = ticks.length / ticksLimit;
      if (!evenMajorSpacing) {
        return Math.max(spacing, 1);
      }
      const factors = _factorize(evenMajorSpacing);
      for (let i = 0, ilen = factors.length - 1; i < ilen; i++) {
        const factor = factors[i];
        if (factor > spacing) {
          return factor;
        }
      }
      return Math.max(spacing, 1);
    }
    function getMajorIndices(ticks) {
      const result = [];
      let i, ilen;
      for (i = 0, ilen = ticks.length; i < ilen; i++) {
        if (ticks[i].major) {
          result.push(i);
        }
      }
      return result;
    }
    function skipMajors(ticks, newTicks, majorIndices, spacing) {
      let count = 0;
      let next = majorIndices[0];
      let i;
      spacing = Math.ceil(spacing);
      for (i = 0; i < ticks.length; i++) {
        if (i === next) {
          newTicks.push(ticks[i]);
          count++;
          next = majorIndices[count * spacing];
        }
      }
    }
    function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
      const start = valueOrDefault(majorStart, 0);
      const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
      let count = 0;
      let length, i, next;
      spacing = Math.ceil(spacing);
      if (majorEnd) {
        length = majorEnd - majorStart;
        spacing = length / Math.floor(length / spacing);
      }
      next = start;
      while (next < 0) {
        count++;
        next = Math.round(start + count * spacing);
      }
      for (i = Math.max(start, 0); i < end; i++) {
        if (i === next) {
          newTicks.push(ticks[i]);
          count++;
          next = Math.round(start + count * spacing);
        }
      }
    }
    function getEvenSpacing(arr) {
      const len = arr.length;
      let i, diff;
      if (len < 2) {
        return false;
      }
      for (diff = arr[0], i = 1; i < len; ++i) {
        if (arr[i] - arr[i - 1] !== diff) {
          return false;
        }
      }
      return diff;
    }

    const reverseAlign = (align) => align === 'left' ? 'right' : align === 'right' ? 'left' : align;
    const offsetFromEdge = (scale, edge, offset) => edge === 'top' || edge === 'left' ? scale[edge] + offset : scale[edge] - offset;
    function sample(arr, numItems) {
      const result = [];
      const increment = arr.length / numItems;
      const len = arr.length;
      let i = 0;
      for (; i < len; i += increment) {
        result.push(arr[Math.floor(i)]);
      }
      return result;
    }
    function getPixelForGridLine(scale, index, offsetGridLines) {
      const length = scale.ticks.length;
      const validIndex = Math.min(index, length - 1);
      const start = scale._startPixel;
      const end = scale._endPixel;
      const epsilon = 1e-6;
      let lineValue = scale.getPixelForTick(validIndex);
      let offset;
      if (offsetGridLines) {
        if (length === 1) {
          offset = Math.max(lineValue - start, end - lineValue);
        } else if (index === 0) {
          offset = (scale.getPixelForTick(1) - lineValue) / 2;
        } else {
          offset = (lineValue - scale.getPixelForTick(validIndex - 1)) / 2;
        }
        lineValue += validIndex < index ? offset : -offset;
        if (lineValue < start - epsilon || lineValue > end + epsilon) {
          return;
        }
      }
      return lineValue;
    }
    function garbageCollect(caches, length) {
      each(caches, (cache) => {
        const gc = cache.gc;
        const gcLen = gc.length / 2;
        let i;
        if (gcLen > length) {
          for (i = 0; i < gcLen; ++i) {
            delete cache.data[gc[i]];
          }
          gc.splice(0, gcLen);
        }
      });
    }
    function getTickMarkLength(options) {
      return options.drawTicks ? options.tickLength : 0;
    }
    function getTitleHeight(options, fallback) {
      if (!options.display) {
        return 0;
      }
      const font = toFont(options.font, fallback);
      const padding = toPadding(options.padding);
      const lines = isArray(options.text) ? options.text.length : 1;
      return (lines * font.lineHeight) + padding.height;
    }
    function createScaleContext(parent, scale) {
      return createContext(parent, {
        scale,
        type: 'scale'
      });
    }
    function createTickContext(parent, index, tick) {
      return createContext(parent, {
        tick,
        index,
        type: 'tick'
      });
    }
    function titleAlign(align, position, reverse) {
      let ret = _toLeftRightCenter(align);
      if ((reverse && position !== 'right') || (!reverse && position === 'right')) {
        ret = reverseAlign(ret);
      }
      return ret;
    }
    function titleArgs(scale, offset, position, align) {
      const {top, left, bottom, right, chart} = scale;
      const {chartArea, scales} = chart;
      let rotation = 0;
      let maxWidth, titleX, titleY;
      const height = bottom - top;
      const width = right - left;
      if (scale.isHorizontal()) {
        titleX = _alignStartEnd(align, left, right);
        if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          titleY = scales[positionAxisID].getPixelForValue(value) + height - offset;
        } else if (position === 'center') {
          titleY = (chartArea.bottom + chartArea.top) / 2 + height - offset;
        } else {
          titleY = offsetFromEdge(scale, position, offset);
        }
        maxWidth = right - left;
      } else {
        if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          titleX = scales[positionAxisID].getPixelForValue(value) - width + offset;
        } else if (position === 'center') {
          titleX = (chartArea.left + chartArea.right) / 2 - width + offset;
        } else {
          titleX = offsetFromEdge(scale, position, offset);
        }
        titleY = _alignStartEnd(align, bottom, top);
        rotation = position === 'left' ? -HALF_PI : HALF_PI;
      }
      return {titleX, titleY, maxWidth, rotation};
    }
    class Scale extends Element {
      constructor(cfg) {
        super();
        this.id = cfg.id;
        this.type = cfg.type;
        this.options = undefined;
        this.ctx = cfg.ctx;
        this.chart = cfg.chart;
        this.top = undefined;
        this.bottom = undefined;
        this.left = undefined;
        this.right = undefined;
        this.width = undefined;
        this.height = undefined;
        this._margins = {
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        };
        this.maxWidth = undefined;
        this.maxHeight = undefined;
        this.paddingTop = undefined;
        this.paddingBottom = undefined;
        this.paddingLeft = undefined;
        this.paddingRight = undefined;
        this.axis = undefined;
        this.labelRotation = undefined;
        this.min = undefined;
        this.max = undefined;
        this._range = undefined;
        this.ticks = [];
        this._gridLineItems = null;
        this._labelItems = null;
        this._labelSizes = null;
        this._length = 0;
        this._maxLength = 0;
        this._longestTextCache = {};
        this._startPixel = undefined;
        this._endPixel = undefined;
        this._reversePixels = false;
        this._userMax = undefined;
        this._userMin = undefined;
        this._suggestedMax = undefined;
        this._suggestedMin = undefined;
        this._ticksLength = 0;
        this._borderValue = 0;
        this._cache = {};
        this._dataLimitsCached = false;
        this.$context = undefined;
      }
      init(options) {
        this.options = options.setContext(this.getContext());
        this.axis = options.axis;
        this._userMin = this.parse(options.min);
        this._userMax = this.parse(options.max);
        this._suggestedMin = this.parse(options.suggestedMin);
        this._suggestedMax = this.parse(options.suggestedMax);
      }
      parse(raw, index) {
        return raw;
      }
      getUserBounds() {
        let {_userMin, _userMax, _suggestedMin, _suggestedMax} = this;
        _userMin = finiteOrDefault(_userMin, Number.POSITIVE_INFINITY);
        _userMax = finiteOrDefault(_userMax, Number.NEGATIVE_INFINITY);
        _suggestedMin = finiteOrDefault(_suggestedMin, Number.POSITIVE_INFINITY);
        _suggestedMax = finiteOrDefault(_suggestedMax, Number.NEGATIVE_INFINITY);
        return {
          min: finiteOrDefault(_userMin, _suggestedMin),
          max: finiteOrDefault(_userMax, _suggestedMax),
          minDefined: isNumberFinite(_userMin),
          maxDefined: isNumberFinite(_userMax)
        };
      }
      getMinMax(canStack) {
        let {min, max, minDefined, maxDefined} = this.getUserBounds();
        let range;
        if (minDefined && maxDefined) {
          return {min, max};
        }
        const metas = this.getMatchingVisibleMetas();
        for (let i = 0, ilen = metas.length; i < ilen; ++i) {
          range = metas[i].controller.getMinMax(this, canStack);
          if (!minDefined) {
            min = Math.min(min, range.min);
          }
          if (!maxDefined) {
            max = Math.max(max, range.max);
          }
        }
        min = maxDefined && min > max ? max : min;
        max = minDefined && min > max ? min : max;
        return {
          min: finiteOrDefault(min, finiteOrDefault(max, min)),
          max: finiteOrDefault(max, finiteOrDefault(min, max))
        };
      }
      getPadding() {
        return {
          left: this.paddingLeft || 0,
          top: this.paddingTop || 0,
          right: this.paddingRight || 0,
          bottom: this.paddingBottom || 0
        };
      }
      getTicks() {
        return this.ticks;
      }
      getLabels() {
        const data = this.chart.data;
        return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
      }
      beforeLayout() {
        this._cache = {};
        this._dataLimitsCached = false;
      }
      beforeUpdate() {
        callback(this.options.beforeUpdate, [this]);
      }
      update(maxWidth, maxHeight, margins) {
        const {beginAtZero, grace, ticks: tickOpts} = this.options;
        const sampleSize = tickOpts.sampleSize;
        this.beforeUpdate();
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this._margins = margins = Object.assign({
          left: 0,
          right: 0,
          top: 0,
          bottom: 0
        }, margins);
        this.ticks = null;
        this._labelSizes = null;
        this._gridLineItems = null;
        this._labelItems = null;
        this.beforeSetDimensions();
        this.setDimensions();
        this.afterSetDimensions();
        this._maxLength = this.isHorizontal()
          ? this.width + margins.left + margins.right
          : this.height + margins.top + margins.bottom;
        if (!this._dataLimitsCached) {
          this.beforeDataLimits();
          this.determineDataLimits();
          this.afterDataLimits();
          this._range = _addGrace(this, grace, beginAtZero);
          this._dataLimitsCached = true;
        }
        this.beforeBuildTicks();
        this.ticks = this.buildTicks() || [];
        this.afterBuildTicks();
        const samplingEnabled = sampleSize < this.ticks.length;
        this._convertTicksToLabels(samplingEnabled ? sample(this.ticks, sampleSize) : this.ticks);
        this.configure();
        this.beforeCalculateLabelRotation();
        this.calculateLabelRotation();
        this.afterCalculateLabelRotation();
        if (tickOpts.display && (tickOpts.autoSkip || tickOpts.source === 'auto')) {
          this.ticks = autoSkip(this, this.ticks);
          this._labelSizes = null;
        }
        if (samplingEnabled) {
          this._convertTicksToLabels(this.ticks);
        }
        this.beforeFit();
        this.fit();
        this.afterFit();
        this.afterUpdate();
      }
      configure() {
        let reversePixels = this.options.reverse;
        let startPixel, endPixel;
        if (this.isHorizontal()) {
          startPixel = this.left;
          endPixel = this.right;
        } else {
          startPixel = this.top;
          endPixel = this.bottom;
          reversePixels = !reversePixels;
        }
        this._startPixel = startPixel;
        this._endPixel = endPixel;
        this._reversePixels = reversePixels;
        this._length = endPixel - startPixel;
        this._alignToPixels = this.options.alignToPixels;
      }
      afterUpdate() {
        callback(this.options.afterUpdate, [this]);
      }
      beforeSetDimensions() {
        callback(this.options.beforeSetDimensions, [this]);
      }
      setDimensions() {
        if (this.isHorizontal()) {
          this.width = this.maxWidth;
          this.left = 0;
          this.right = this.width;
        } else {
          this.height = this.maxHeight;
          this.top = 0;
          this.bottom = this.height;
        }
        this.paddingLeft = 0;
        this.paddingTop = 0;
        this.paddingRight = 0;
        this.paddingBottom = 0;
      }
      afterSetDimensions() {
        callback(this.options.afterSetDimensions, [this]);
      }
      _callHooks(name) {
        this.chart.notifyPlugins(name, this.getContext());
        callback(this.options[name], [this]);
      }
      beforeDataLimits() {
        this._callHooks('beforeDataLimits');
      }
      determineDataLimits() {}
      afterDataLimits() {
        this._callHooks('afterDataLimits');
      }
      beforeBuildTicks() {
        this._callHooks('beforeBuildTicks');
      }
      buildTicks() {
        return [];
      }
      afterBuildTicks() {
        this._callHooks('afterBuildTicks');
      }
      beforeTickToLabelConversion() {
        callback(this.options.beforeTickToLabelConversion, [this]);
      }
      generateTickLabels(ticks) {
        const tickOpts = this.options.ticks;
        let i, ilen, tick;
        for (i = 0, ilen = ticks.length; i < ilen; i++) {
          tick = ticks[i];
          tick.label = callback(tickOpts.callback, [tick.value, i, ticks], this);
        }
      }
      afterTickToLabelConversion() {
        callback(this.options.afterTickToLabelConversion, [this]);
      }
      beforeCalculateLabelRotation() {
        callback(this.options.beforeCalculateLabelRotation, [this]);
      }
      calculateLabelRotation() {
        const options = this.options;
        const tickOpts = options.ticks;
        const numTicks = this.ticks.length;
        const minRotation = tickOpts.minRotation || 0;
        const maxRotation = tickOpts.maxRotation;
        let labelRotation = minRotation;
        let tickWidth, maxHeight, maxLabelDiagonal;
        if (!this._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !this.isHorizontal()) {
          this.labelRotation = minRotation;
          return;
        }
        const labelSizes = this._getLabelSizes();
        const maxLabelWidth = labelSizes.widest.width;
        const maxLabelHeight = labelSizes.highest.height;
        const maxWidth = _limitValue(this.chart.width - maxLabelWidth, 0, this.maxWidth);
        tickWidth = options.offset ? this.maxWidth / numTicks : maxWidth / (numTicks - 1);
        if (maxLabelWidth + 6 > tickWidth) {
          tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
          maxHeight = this.maxHeight - getTickMarkLength(options.grid)
    				- tickOpts.padding - getTitleHeight(options.title, this.chart.options.font);
          maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
          labelRotation = toDegrees(Math.min(
            Math.asin(_limitValue((labelSizes.highest.height + 6) / tickWidth, -1, 1)),
            Math.asin(_limitValue(maxHeight / maxLabelDiagonal, -1, 1)) - Math.asin(_limitValue(maxLabelHeight / maxLabelDiagonal, -1, 1))
          ));
          labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
        }
        this.labelRotation = labelRotation;
      }
      afterCalculateLabelRotation() {
        callback(this.options.afterCalculateLabelRotation, [this]);
      }
      beforeFit() {
        callback(this.options.beforeFit, [this]);
      }
      fit() {
        const minSize = {
          width: 0,
          height: 0
        };
        const {chart, options: {ticks: tickOpts, title: titleOpts, grid: gridOpts}} = this;
        const display = this._isVisible();
        const isHorizontal = this.isHorizontal();
        if (display) {
          const titleHeight = getTitleHeight(titleOpts, chart.options.font);
          if (isHorizontal) {
            minSize.width = this.maxWidth;
            minSize.height = getTickMarkLength(gridOpts) + titleHeight;
          } else {
            minSize.height = this.maxHeight;
            minSize.width = getTickMarkLength(gridOpts) + titleHeight;
          }
          if (tickOpts.display && this.ticks.length) {
            const {first, last, widest, highest} = this._getLabelSizes();
            const tickPadding = tickOpts.padding * 2;
            const angleRadians = toRadians(this.labelRotation);
            const cos = Math.cos(angleRadians);
            const sin = Math.sin(angleRadians);
            if (isHorizontal) {
              const labelHeight = tickOpts.mirror ? 0 : sin * widest.width + cos * highest.height;
              minSize.height = Math.min(this.maxHeight, minSize.height + labelHeight + tickPadding);
            } else {
              const labelWidth = tickOpts.mirror ? 0 : cos * widest.width + sin * highest.height;
              minSize.width = Math.min(this.maxWidth, minSize.width + labelWidth + tickPadding);
            }
            this._calculatePadding(first, last, sin, cos);
          }
        }
        this._handleMargins();
        if (isHorizontal) {
          this.width = this._length = chart.width - this._margins.left - this._margins.right;
          this.height = minSize.height;
        } else {
          this.width = minSize.width;
          this.height = this._length = chart.height - this._margins.top - this._margins.bottom;
        }
      }
      _calculatePadding(first, last, sin, cos) {
        const {ticks: {align, padding}, position} = this.options;
        const isRotated = this.labelRotation !== 0;
        const labelsBelowTicks = position !== 'top' && this.axis === 'x';
        if (this.isHorizontal()) {
          const offsetLeft = this.getPixelForTick(0) - this.left;
          const offsetRight = this.right - this.getPixelForTick(this.ticks.length - 1);
          let paddingLeft = 0;
          let paddingRight = 0;
          if (isRotated) {
            if (labelsBelowTicks) {
              paddingLeft = cos * first.width;
              paddingRight = sin * last.height;
            } else {
              paddingLeft = sin * first.height;
              paddingRight = cos * last.width;
            }
          } else if (align === 'start') {
            paddingRight = last.width;
          } else if (align === 'end') {
            paddingLeft = first.width;
          } else {
            paddingLeft = first.width / 2;
            paddingRight = last.width / 2;
          }
          this.paddingLeft = Math.max((paddingLeft - offsetLeft + padding) * this.width / (this.width - offsetLeft), 0);
          this.paddingRight = Math.max((paddingRight - offsetRight + padding) * this.width / (this.width - offsetRight), 0);
        } else {
          let paddingTop = last.height / 2;
          let paddingBottom = first.height / 2;
          if (align === 'start') {
            paddingTop = 0;
            paddingBottom = first.height;
          } else if (align === 'end') {
            paddingTop = last.height;
            paddingBottom = 0;
          }
          this.paddingTop = paddingTop + padding;
          this.paddingBottom = paddingBottom + padding;
        }
      }
      _handleMargins() {
        if (this._margins) {
          this._margins.left = Math.max(this.paddingLeft, this._margins.left);
          this._margins.top = Math.max(this.paddingTop, this._margins.top);
          this._margins.right = Math.max(this.paddingRight, this._margins.right);
          this._margins.bottom = Math.max(this.paddingBottom, this._margins.bottom);
        }
      }
      afterFit() {
        callback(this.options.afterFit, [this]);
      }
      isHorizontal() {
        const {axis, position} = this.options;
        return position === 'top' || position === 'bottom' || axis === 'x';
      }
      isFullSize() {
        return this.options.fullSize;
      }
      _convertTicksToLabels(ticks) {
        this.beforeTickToLabelConversion();
        this.generateTickLabels(ticks);
        let i, ilen;
        for (i = 0, ilen = ticks.length; i < ilen; i++) {
          if (isNullOrUndef(ticks[i].label)) {
            ticks.splice(i, 1);
            ilen--;
            i--;
          }
        }
        this.afterTickToLabelConversion();
      }
      _getLabelSizes() {
        let labelSizes = this._labelSizes;
        if (!labelSizes) {
          const sampleSize = this.options.ticks.sampleSize;
          let ticks = this.ticks;
          if (sampleSize < ticks.length) {
            ticks = sample(ticks, sampleSize);
          }
          this._labelSizes = labelSizes = this._computeLabelSizes(ticks, ticks.length);
        }
        return labelSizes;
      }
      _computeLabelSizes(ticks, length) {
        const {ctx, _longestTextCache: caches} = this;
        const widths = [];
        const heights = [];
        let widestLabelSize = 0;
        let highestLabelSize = 0;
        let i, j, jlen, label, tickFont, fontString, cache, lineHeight, width, height, nestedLabel;
        for (i = 0; i < length; ++i) {
          label = ticks[i].label;
          tickFont = this._resolveTickFontOptions(i);
          ctx.font = fontString = tickFont.string;
          cache = caches[fontString] = caches[fontString] || {data: {}, gc: []};
          lineHeight = tickFont.lineHeight;
          width = height = 0;
          if (!isNullOrUndef(label) && !isArray(label)) {
            width = _measureText(ctx, cache.data, cache.gc, width, label);
            height = lineHeight;
          } else if (isArray(label)) {
            for (j = 0, jlen = label.length; j < jlen; ++j) {
              nestedLabel = label[j];
              if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
                width = _measureText(ctx, cache.data, cache.gc, width, nestedLabel);
                height += lineHeight;
              }
            }
          }
          widths.push(width);
          heights.push(height);
          widestLabelSize = Math.max(width, widestLabelSize);
          highestLabelSize = Math.max(height, highestLabelSize);
        }
        garbageCollect(caches, length);
        const widest = widths.indexOf(widestLabelSize);
        const highest = heights.indexOf(highestLabelSize);
        const valueAt = (idx) => ({width: widths[idx] || 0, height: heights[idx] || 0});
        return {
          first: valueAt(0),
          last: valueAt(length - 1),
          widest: valueAt(widest),
          highest: valueAt(highest),
          widths,
          heights,
        };
      }
      getLabelForValue(value) {
        return value;
      }
      getPixelForValue(value, index) {
        return NaN;
      }
      getValueForPixel(pixel) {}
      getPixelForTick(index) {
        const ticks = this.ticks;
        if (index < 0 || index > ticks.length - 1) {
          return null;
        }
        return this.getPixelForValue(ticks[index].value);
      }
      getPixelForDecimal(decimal) {
        if (this._reversePixels) {
          decimal = 1 - decimal;
        }
        const pixel = this._startPixel + decimal * this._length;
        return _int16Range(this._alignToPixels ? _alignPixel(this.chart, pixel, 0) : pixel);
      }
      getDecimalForPixel(pixel) {
        const decimal = (pixel - this._startPixel) / this._length;
        return this._reversePixels ? 1 - decimal : decimal;
      }
      getBasePixel() {
        return this.getPixelForValue(this.getBaseValue());
      }
      getBaseValue() {
        const {min, max} = this;
        return min < 0 && max < 0 ? max :
          min > 0 && max > 0 ? min :
          0;
      }
      getContext(index) {
        const ticks = this.ticks || [];
        if (index >= 0 && index < ticks.length) {
          const tick = ticks[index];
          return tick.$context ||
    				(tick.$context = createTickContext(this.getContext(), index, tick));
        }
        return this.$context ||
    			(this.$context = createScaleContext(this.chart.getContext(), this));
      }
      _tickSize() {
        const optionTicks = this.options.ticks;
        const rot = toRadians(this.labelRotation);
        const cos = Math.abs(Math.cos(rot));
        const sin = Math.abs(Math.sin(rot));
        const labelSizes = this._getLabelSizes();
        const padding = optionTicks.autoSkipPadding || 0;
        const w = labelSizes ? labelSizes.widest.width + padding : 0;
        const h = labelSizes ? labelSizes.highest.height + padding : 0;
        return this.isHorizontal()
          ? h * cos > w * sin ? w / cos : h / sin
          : h * sin < w * cos ? h / cos : w / sin;
      }
      _isVisible() {
        const display = this.options.display;
        if (display !== 'auto') {
          return !!display;
        }
        return this.getMatchingVisibleMetas().length > 0;
      }
      _computeGridLineItems(chartArea) {
        const axis = this.axis;
        const chart = this.chart;
        const options = this.options;
        const {grid, position} = options;
        const offset = grid.offset;
        const isHorizontal = this.isHorizontal();
        const ticks = this.ticks;
        const ticksLength = ticks.length + (offset ? 1 : 0);
        const tl = getTickMarkLength(grid);
        const items = [];
        const borderOpts = grid.setContext(this.getContext());
        const axisWidth = borderOpts.drawBorder ? borderOpts.borderWidth : 0;
        const axisHalfWidth = axisWidth / 2;
        const alignBorderValue = function(pixel) {
          return _alignPixel(chart, pixel, axisWidth);
        };
        let borderValue, i, lineValue, alignedLineValue;
        let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
        if (position === 'top') {
          borderValue = alignBorderValue(this.bottom);
          ty1 = this.bottom - tl;
          ty2 = borderValue - axisHalfWidth;
          y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
          y2 = chartArea.bottom;
        } else if (position === 'bottom') {
          borderValue = alignBorderValue(this.top);
          y1 = chartArea.top;
          y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
          ty1 = borderValue + axisHalfWidth;
          ty2 = this.top + tl;
        } else if (position === 'left') {
          borderValue = alignBorderValue(this.right);
          tx1 = this.right - tl;
          tx2 = borderValue - axisHalfWidth;
          x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
          x2 = chartArea.right;
        } else if (position === 'right') {
          borderValue = alignBorderValue(this.left);
          x1 = chartArea.left;
          x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
          tx1 = borderValue + axisHalfWidth;
          tx2 = this.left + tl;
        } else if (axis === 'x') {
          if (position === 'center') {
            borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
          }
          y1 = chartArea.top;
          y2 = chartArea.bottom;
          ty1 = borderValue + axisHalfWidth;
          ty2 = ty1 + tl;
        } else if (axis === 'y') {
          if (position === 'center') {
            borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            borderValue = alignBorderValue(this.chart.scales[positionAxisID].getPixelForValue(value));
          }
          tx1 = borderValue - axisHalfWidth;
          tx2 = tx1 - tl;
          x1 = chartArea.left;
          x2 = chartArea.right;
        }
        const limit = valueOrDefault(options.ticks.maxTicksLimit, ticksLength);
        const step = Math.max(1, Math.ceil(ticksLength / limit));
        for (i = 0; i < ticksLength; i += step) {
          const optsAtIndex = grid.setContext(this.getContext(i));
          const lineWidth = optsAtIndex.lineWidth;
          const lineColor = optsAtIndex.color;
          const borderDash = grid.borderDash || [];
          const borderDashOffset = optsAtIndex.borderDashOffset;
          const tickWidth = optsAtIndex.tickWidth;
          const tickColor = optsAtIndex.tickColor;
          const tickBorderDash = optsAtIndex.tickBorderDash || [];
          const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;
          lineValue = getPixelForGridLine(this, i, offset);
          if (lineValue === undefined) {
            continue;
          }
          alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
          if (isHorizontal) {
            tx1 = tx2 = x1 = x2 = alignedLineValue;
          } else {
            ty1 = ty2 = y1 = y2 = alignedLineValue;
          }
          items.push({
            tx1,
            ty1,
            tx2,
            ty2,
            x1,
            y1,
            x2,
            y2,
            width: lineWidth,
            color: lineColor,
            borderDash,
            borderDashOffset,
            tickWidth,
            tickColor,
            tickBorderDash,
            tickBorderDashOffset,
          });
        }
        this._ticksLength = ticksLength;
        this._borderValue = borderValue;
        return items;
      }
      _computeLabelItems(chartArea) {
        const axis = this.axis;
        const options = this.options;
        const {position, ticks: optionTicks} = options;
        const isHorizontal = this.isHorizontal();
        const ticks = this.ticks;
        const {align, crossAlign, padding, mirror} = optionTicks;
        const tl = getTickMarkLength(options.grid);
        const tickAndPadding = tl + padding;
        const hTickAndPadding = mirror ? -padding : tickAndPadding;
        const rotation = -toRadians(this.labelRotation);
        const items = [];
        let i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
        let textBaseline = 'middle';
        if (position === 'top') {
          y = this.bottom - hTickAndPadding;
          textAlign = this._getXAxisLabelAlignment();
        } else if (position === 'bottom') {
          y = this.top + hTickAndPadding;
          textAlign = this._getXAxisLabelAlignment();
        } else if (position === 'left') {
          const ret = this._getYAxisLabelAlignment(tl);
          textAlign = ret.textAlign;
          x = ret.x;
        } else if (position === 'right') {
          const ret = this._getYAxisLabelAlignment(tl);
          textAlign = ret.textAlign;
          x = ret.x;
        } else if (axis === 'x') {
          if (position === 'center') {
            y = ((chartArea.top + chartArea.bottom) / 2) + tickAndPadding;
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            y = this.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
          }
          textAlign = this._getXAxisLabelAlignment();
        } else if (axis === 'y') {
          if (position === 'center') {
            x = ((chartArea.left + chartArea.right) / 2) - tickAndPadding;
          } else if (isObject(position)) {
            const positionAxisID = Object.keys(position)[0];
            const value = position[positionAxisID];
            x = this.chart.scales[positionAxisID].getPixelForValue(value);
          }
          textAlign = this._getYAxisLabelAlignment(tl).textAlign;
        }
        if (axis === 'y') {
          if (align === 'start') {
            textBaseline = 'top';
          } else if (align === 'end') {
            textBaseline = 'bottom';
          }
        }
        const labelSizes = this._getLabelSizes();
        for (i = 0, ilen = ticks.length; i < ilen; ++i) {
          tick = ticks[i];
          label = tick.label;
          const optsAtIndex = optionTicks.setContext(this.getContext(i));
          pixel = this.getPixelForTick(i) + optionTicks.labelOffset;
          font = this._resolveTickFontOptions(i);
          lineHeight = font.lineHeight;
          lineCount = isArray(label) ? label.length : 1;
          const halfCount = lineCount / 2;
          const color = optsAtIndex.color;
          const strokeColor = optsAtIndex.textStrokeColor;
          const strokeWidth = optsAtIndex.textStrokeWidth;
          if (isHorizontal) {
            x = pixel;
            if (position === 'top') {
              if (crossAlign === 'near' || rotation !== 0) {
                textOffset = -lineCount * lineHeight + lineHeight / 2;
              } else if (crossAlign === 'center') {
                textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
              } else {
                textOffset = -labelSizes.highest.height + lineHeight / 2;
              }
            } else {
              if (crossAlign === 'near' || rotation !== 0) {
                textOffset = lineHeight / 2;
              } else if (crossAlign === 'center') {
                textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
              } else {
                textOffset = labelSizes.highest.height - lineCount * lineHeight;
              }
            }
            if (mirror) {
              textOffset *= -1;
            }
          } else {
            y = pixel;
            textOffset = (1 - lineCount) * lineHeight / 2;
          }
          let backdrop;
          if (optsAtIndex.showLabelBackdrop) {
            const labelPadding = toPadding(optsAtIndex.backdropPadding);
            const height = labelSizes.heights[i];
            const width = labelSizes.widths[i];
            let top = y + textOffset - labelPadding.top;
            let left = x - labelPadding.left;
            switch (textBaseline) {
            case 'middle':
              top -= height / 2;
              break;
            case 'bottom':
              top -= height;
              break;
            }
            switch (textAlign) {
            case 'center':
              left -= width / 2;
              break;
            case 'right':
              left -= width;
              break;
            }
            backdrop = {
              left,
              top,
              width: width + labelPadding.width,
              height: height + labelPadding.height,
              color: optsAtIndex.backdropColor,
            };
          }
          items.push({
            rotation,
            label,
            font,
            color,
            strokeColor,
            strokeWidth,
            textOffset,
            textAlign,
            textBaseline,
            translation: [x, y],
            backdrop,
          });
        }
        return items;
      }
      _getXAxisLabelAlignment() {
        const {position, ticks} = this.options;
        const rotation = -toRadians(this.labelRotation);
        if (rotation) {
          return position === 'top' ? 'left' : 'right';
        }
        let align = 'center';
        if (ticks.align === 'start') {
          align = 'left';
        } else if (ticks.align === 'end') {
          align = 'right';
        }
        return align;
      }
      _getYAxisLabelAlignment(tl) {
        const {position, ticks: {crossAlign, mirror, padding}} = this.options;
        const labelSizes = this._getLabelSizes();
        const tickAndPadding = tl + padding;
        const widest = labelSizes.widest.width;
        let textAlign;
        let x;
        if (position === 'left') {
          if (mirror) {
            x = this.right + padding;
            if (crossAlign === 'near') {
              textAlign = 'left';
            } else if (crossAlign === 'center') {
              textAlign = 'center';
              x += (widest / 2);
            } else {
              textAlign = 'right';
              x += widest;
            }
          } else {
            x = this.right - tickAndPadding;
            if (crossAlign === 'near') {
              textAlign = 'right';
            } else if (crossAlign === 'center') {
              textAlign = 'center';
              x -= (widest / 2);
            } else {
              textAlign = 'left';
              x = this.left;
            }
          }
        } else if (position === 'right') {
          if (mirror) {
            x = this.left + padding;
            if (crossAlign === 'near') {
              textAlign = 'right';
            } else if (crossAlign === 'center') {
              textAlign = 'center';
              x -= (widest / 2);
            } else {
              textAlign = 'left';
              x -= widest;
            }
          } else {
            x = this.left + tickAndPadding;
            if (crossAlign === 'near') {
              textAlign = 'left';
            } else if (crossAlign === 'center') {
              textAlign = 'center';
              x += widest / 2;
            } else {
              textAlign = 'right';
              x = this.right;
            }
          }
        } else {
          textAlign = 'right';
        }
        return {textAlign, x};
      }
      _computeLabelArea() {
        if (this.options.ticks.mirror) {
          return;
        }
        const chart = this.chart;
        const position = this.options.position;
        if (position === 'left' || position === 'right') {
          return {top: 0, left: this.left, bottom: chart.height, right: this.right};
        } if (position === 'top' || position === 'bottom') {
          return {top: this.top, left: 0, bottom: this.bottom, right: chart.width};
        }
      }
      drawBackground() {
        const {ctx, options: {backgroundColor}, left, top, width, height} = this;
        if (backgroundColor) {
          ctx.save();
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(left, top, width, height);
          ctx.restore();
        }
      }
      getLineWidthForValue(value) {
        const grid = this.options.grid;
        if (!this._isVisible() || !grid.display) {
          return 0;
        }
        const ticks = this.ticks;
        const index = ticks.findIndex(t => t.value === value);
        if (index >= 0) {
          const opts = grid.setContext(this.getContext(index));
          return opts.lineWidth;
        }
        return 0;
      }
      drawGrid(chartArea) {
        const grid = this.options.grid;
        const ctx = this.ctx;
        const items = this._gridLineItems || (this._gridLineItems = this._computeGridLineItems(chartArea));
        let i, ilen;
        const drawLine = (p1, p2, style) => {
          if (!style.width || !style.color) {
            return;
          }
          ctx.save();
          ctx.lineWidth = style.width;
          ctx.strokeStyle = style.color;
          ctx.setLineDash(style.borderDash || []);
          ctx.lineDashOffset = style.borderDashOffset;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
          ctx.restore();
        };
        if (grid.display) {
          for (i = 0, ilen = items.length; i < ilen; ++i) {
            const item = items[i];
            if (grid.drawOnChartArea) {
              drawLine(
                {x: item.x1, y: item.y1},
                {x: item.x2, y: item.y2},
                item
              );
            }
            if (grid.drawTicks) {
              drawLine(
                {x: item.tx1, y: item.ty1},
                {x: item.tx2, y: item.ty2},
                {
                  color: item.tickColor,
                  width: item.tickWidth,
                  borderDash: item.tickBorderDash,
                  borderDashOffset: item.tickBorderDashOffset
                }
              );
            }
          }
        }
      }
      drawBorder() {
        const {chart, ctx, options: {grid}} = this;
        const borderOpts = grid.setContext(this.getContext());
        const axisWidth = grid.drawBorder ? borderOpts.borderWidth : 0;
        if (!axisWidth) {
          return;
        }
        const lastLineWidth = grid.setContext(this.getContext(0)).lineWidth;
        const borderValue = this._borderValue;
        let x1, x2, y1, y2;
        if (this.isHorizontal()) {
          x1 = _alignPixel(chart, this.left, axisWidth) - axisWidth / 2;
          x2 = _alignPixel(chart, this.right, lastLineWidth) + lastLineWidth / 2;
          y1 = y2 = borderValue;
        } else {
          y1 = _alignPixel(chart, this.top, axisWidth) - axisWidth / 2;
          y2 = _alignPixel(chart, this.bottom, lastLineWidth) + lastLineWidth / 2;
          x1 = x2 = borderValue;
        }
        ctx.save();
        ctx.lineWidth = borderOpts.borderWidth;
        ctx.strokeStyle = borderOpts.borderColor;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }
      drawLabels(chartArea) {
        const optionTicks = this.options.ticks;
        if (!optionTicks.display) {
          return;
        }
        const ctx = this.ctx;
        const area = this._computeLabelArea();
        if (area) {
          clipArea(ctx, area);
        }
        const items = this._labelItems || (this._labelItems = this._computeLabelItems(chartArea));
        let i, ilen;
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          const item = items[i];
          const tickFont = item.font;
          const label = item.label;
          if (item.backdrop) {
            ctx.fillStyle = item.backdrop.color;
            ctx.fillRect(item.backdrop.left, item.backdrop.top, item.backdrop.width, item.backdrop.height);
          }
          let y = item.textOffset;
          renderText(ctx, label, 0, y, tickFont, item);
        }
        if (area) {
          unclipArea(ctx);
        }
      }
      drawTitle() {
        const {ctx, options: {position, title, reverse}} = this;
        if (!title.display) {
          return;
        }
        const font = toFont(title.font);
        const padding = toPadding(title.padding);
        const align = title.align;
        let offset = font.lineHeight / 2;
        if (position === 'bottom' || position === 'center' || isObject(position)) {
          offset += padding.bottom;
          if (isArray(title.text)) {
            offset += font.lineHeight * (title.text.length - 1);
          }
        } else {
          offset += padding.top;
        }
        const {titleX, titleY, maxWidth, rotation} = titleArgs(this, offset, position, align);
        renderText(ctx, title.text, 0, 0, font, {
          color: title.color,
          maxWidth,
          rotation,
          textAlign: titleAlign(align, position, reverse),
          textBaseline: 'middle',
          translation: [titleX, titleY],
        });
      }
      draw(chartArea) {
        if (!this._isVisible()) {
          return;
        }
        this.drawBackground();
        this.drawGrid(chartArea);
        this.drawBorder();
        this.drawTitle();
        this.drawLabels(chartArea);
      }
      _layers() {
        const opts = this.options;
        const tz = opts.ticks && opts.ticks.z || 0;
        const gz = valueOrDefault(opts.grid && opts.grid.z, -1);
        if (!this._isVisible() || this.draw !== Scale.prototype.draw) {
          return [{
            z: tz,
            draw: (chartArea) => {
              this.draw(chartArea);
            }
          }];
        }
        return [{
          z: gz,
          draw: (chartArea) => {
            this.drawBackground();
            this.drawGrid(chartArea);
            this.drawTitle();
          }
        }, {
          z: gz + 1,
          draw: () => {
            this.drawBorder();
          }
        }, {
          z: tz,
          draw: (chartArea) => {
            this.drawLabels(chartArea);
          }
        }];
      }
      getMatchingVisibleMetas(type) {
        const metas = this.chart.getSortedVisibleDatasetMetas();
        const axisID = this.axis + 'AxisID';
        const result = [];
        let i, ilen;
        for (i = 0, ilen = metas.length; i < ilen; ++i) {
          const meta = metas[i];
          if (meta[axisID] === this.id && (!type || meta.type === type)) {
            result.push(meta);
          }
        }
        return result;
      }
      _resolveTickFontOptions(index) {
        const opts = this.options.ticks.setContext(this.getContext(index));
        return toFont(opts.font);
      }
      _maxDigits() {
        const fontSize = this._resolveTickFontOptions(0).lineHeight;
        return (this.isHorizontal() ? this.width : this.height) / fontSize;
      }
    }

    class TypedRegistry {
      constructor(type, scope, override) {
        this.type = type;
        this.scope = scope;
        this.override = override;
        this.items = Object.create(null);
      }
      isForType(type) {
        return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
      }
      register(item) {
        const proto = Object.getPrototypeOf(item);
        let parentScope;
        if (isIChartComponent(proto)) {
          parentScope = this.register(proto);
        }
        const items = this.items;
        const id = item.id;
        const scope = this.scope + '.' + id;
        if (!id) {
          throw new Error('class does not have id: ' + item);
        }
        if (id in items) {
          return scope;
        }
        items[id] = item;
        registerDefaults(item, scope, parentScope);
        if (this.override) {
          defaults.override(item.id, item.overrides);
        }
        return scope;
      }
      get(id) {
        return this.items[id];
      }
      unregister(item) {
        const items = this.items;
        const id = item.id;
        const scope = this.scope;
        if (id in items) {
          delete items[id];
        }
        if (scope && id in defaults[scope]) {
          delete defaults[scope][id];
          if (this.override) {
            delete overrides[id];
          }
        }
      }
    }
    function registerDefaults(item, scope, parentScope) {
      const itemDefaults = merge(Object.create(null), [
        parentScope ? defaults.get(parentScope) : {},
        defaults.get(scope),
        item.defaults
      ]);
      defaults.set(scope, itemDefaults);
      if (item.defaultRoutes) {
        routeDefaults(scope, item.defaultRoutes);
      }
      if (item.descriptors) {
        defaults.describe(scope, item.descriptors);
      }
    }
    function routeDefaults(scope, routes) {
      Object.keys(routes).forEach(property => {
        const propertyParts = property.split('.');
        const sourceName = propertyParts.pop();
        const sourceScope = [scope].concat(propertyParts).join('.');
        const parts = routes[property].split('.');
        const targetName = parts.pop();
        const targetScope = parts.join('.');
        defaults.route(sourceScope, sourceName, targetScope, targetName);
      });
    }
    function isIChartComponent(proto) {
      return 'id' in proto && 'defaults' in proto;
    }

    class Registry {
      constructor() {
        this.controllers = new TypedRegistry(DatasetController, 'datasets', true);
        this.elements = new TypedRegistry(Element, 'elements');
        this.plugins = new TypedRegistry(Object, 'plugins');
        this.scales = new TypedRegistry(Scale, 'scales');
        this._typedRegistries = [this.controllers, this.scales, this.elements];
      }
      add(...args) {
        this._each('register', args);
      }
      remove(...args) {
        this._each('unregister', args);
      }
      addControllers(...args) {
        this._each('register', args, this.controllers);
      }
      addElements(...args) {
        this._each('register', args, this.elements);
      }
      addPlugins(...args) {
        this._each('register', args, this.plugins);
      }
      addScales(...args) {
        this._each('register', args, this.scales);
      }
      getController(id) {
        return this._get(id, this.controllers, 'controller');
      }
      getElement(id) {
        return this._get(id, this.elements, 'element');
      }
      getPlugin(id) {
        return this._get(id, this.plugins, 'plugin');
      }
      getScale(id) {
        return this._get(id, this.scales, 'scale');
      }
      removeControllers(...args) {
        this._each('unregister', args, this.controllers);
      }
      removeElements(...args) {
        this._each('unregister', args, this.elements);
      }
      removePlugins(...args) {
        this._each('unregister', args, this.plugins);
      }
      removeScales(...args) {
        this._each('unregister', args, this.scales);
      }
      _each(method, args, typedRegistry) {
        [...args].forEach(arg => {
          const reg = typedRegistry || this._getRegistryForType(arg);
          if (typedRegistry || reg.isForType(arg) || (reg === this.plugins && arg.id)) {
            this._exec(method, reg, arg);
          } else {
            each(arg, item => {
              const itemReg = typedRegistry || this._getRegistryForType(item);
              this._exec(method, itemReg, item);
            });
          }
        });
      }
      _exec(method, registry, component) {
        const camelMethod = _capitalize(method);
        callback(component['before' + camelMethod], [], component);
        registry[method](component);
        callback(component['after' + camelMethod], [], component);
      }
      _getRegistryForType(type) {
        for (let i = 0; i < this._typedRegistries.length; i++) {
          const reg = this._typedRegistries[i];
          if (reg.isForType(type)) {
            return reg;
          }
        }
        return this.plugins;
      }
      _get(id, typedRegistry, type) {
        const item = typedRegistry.get(id);
        if (item === undefined) {
          throw new Error('"' + id + '" is not a registered ' + type + '.');
        }
        return item;
      }
    }
    var registry = new Registry();

    class PluginService {
      constructor() {
        this._init = [];
      }
      notify(chart, hook, args, filter) {
        if (hook === 'beforeInit') {
          this._init = this._createDescriptors(chart, true);
          this._notify(this._init, chart, 'install');
        }
        const descriptors = filter ? this._descriptors(chart).filter(filter) : this._descriptors(chart);
        const result = this._notify(descriptors, chart, hook, args);
        if (hook === 'destroy') {
          this._notify(descriptors, chart, 'stop');
          this._notify(this._init, chart, 'uninstall');
        }
        return result;
      }
      _notify(descriptors, chart, hook, args) {
        args = args || {};
        for (const descriptor of descriptors) {
          const plugin = descriptor.plugin;
          const method = plugin[hook];
          const params = [chart, args, descriptor.options];
          if (callback(method, params, plugin) === false && args.cancelable) {
            return false;
          }
        }
        return true;
      }
      invalidate() {
        if (!isNullOrUndef(this._cache)) {
          this._oldCache = this._cache;
          this._cache = undefined;
        }
      }
      _descriptors(chart) {
        if (this._cache) {
          return this._cache;
        }
        const descriptors = this._cache = this._createDescriptors(chart);
        this._notifyStateChanges(chart);
        return descriptors;
      }
      _createDescriptors(chart, all) {
        const config = chart && chart.config;
        const options = valueOrDefault(config.options && config.options.plugins, {});
        const plugins = allPlugins(config);
        return options === false && !all ? [] : createDescriptors(chart, plugins, options, all);
      }
      _notifyStateChanges(chart) {
        const previousDescriptors = this._oldCache || [];
        const descriptors = this._cache;
        const diff = (a, b) => a.filter(x => !b.some(y => x.plugin.id === y.plugin.id));
        this._notify(diff(previousDescriptors, descriptors), chart, 'stop');
        this._notify(diff(descriptors, previousDescriptors), chart, 'start');
      }
    }
    function allPlugins(config) {
      const plugins = [];
      const keys = Object.keys(registry.plugins.items);
      for (let i = 0; i < keys.length; i++) {
        plugins.push(registry.getPlugin(keys[i]));
      }
      const local = config.plugins || [];
      for (let i = 0; i < local.length; i++) {
        const plugin = local[i];
        if (plugins.indexOf(plugin) === -1) {
          plugins.push(plugin);
        }
      }
      return plugins;
    }
    function getOpts(options, all) {
      if (!all && options === false) {
        return null;
      }
      if (options === true) {
        return {};
      }
      return options;
    }
    function createDescriptors(chart, plugins, options, all) {
      const result = [];
      const context = chart.getContext();
      for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        const id = plugin.id;
        const opts = getOpts(options[id], all);
        if (opts === null) {
          continue;
        }
        result.push({
          plugin,
          options: pluginOpts(chart.config, plugin, opts, context)
        });
      }
      return result;
    }
    function pluginOpts(config, plugin, opts, context) {
      const keys = config.pluginScopeKeys(plugin);
      const scopes = config.getOptionScopes(opts, keys);
      return config.createResolver(scopes, context, [''], {scriptable: false, indexable: false, allKeys: true});
    }

    function getIndexAxis(type, options) {
      const datasetDefaults = defaults.datasets[type] || {};
      const datasetOptions = (options.datasets || {})[type] || {};
      return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || 'x';
    }
    function getAxisFromDefaultScaleID(id, indexAxis) {
      let axis = id;
      if (id === '_index_') {
        axis = indexAxis;
      } else if (id === '_value_') {
        axis = indexAxis === 'x' ? 'y' : 'x';
      }
      return axis;
    }
    function getDefaultScaleIDFromAxis(axis, indexAxis) {
      return axis === indexAxis ? '_index_' : '_value_';
    }
    function axisFromPosition(position) {
      if (position === 'top' || position === 'bottom') {
        return 'x';
      }
      if (position === 'left' || position === 'right') {
        return 'y';
      }
    }
    function determineAxis(id, scaleOptions) {
      if (id === 'x' || id === 'y') {
        return id;
      }
      return scaleOptions.axis || axisFromPosition(scaleOptions.position) || id.charAt(0).toLowerCase();
    }
    function mergeScaleConfig(config, options) {
      const chartDefaults = overrides[config.type] || {scales: {}};
      const configScales = options.scales || {};
      const chartIndexAxis = getIndexAxis(config.type, options);
      const firstIDs = Object.create(null);
      const scales = Object.create(null);
      Object.keys(configScales).forEach(id => {
        const scaleConf = configScales[id];
        if (!isObject(scaleConf)) {
          return console.error(`Invalid scale configuration for scale: ${id}`);
        }
        if (scaleConf._proxy) {
          return console.warn(`Ignoring resolver passed as options for scale: ${id}`);
        }
        const axis = determineAxis(id, scaleConf);
        const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
        const defaultScaleOptions = chartDefaults.scales || {};
        firstIDs[axis] = firstIDs[axis] || id;
        scales[id] = mergeIf(Object.create(null), [{axis}, scaleConf, defaultScaleOptions[axis], defaultScaleOptions[defaultId]]);
      });
      config.data.datasets.forEach(dataset => {
        const type = dataset.type || config.type;
        const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
        const datasetDefaults = overrides[type] || {};
        const defaultScaleOptions = datasetDefaults.scales || {};
        Object.keys(defaultScaleOptions).forEach(defaultID => {
          const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
          const id = dataset[axis + 'AxisID'] || firstIDs[axis] || axis;
          scales[id] = scales[id] || Object.create(null);
          mergeIf(scales[id], [{axis}, configScales[id], defaultScaleOptions[defaultID]]);
        });
      });
      Object.keys(scales).forEach(key => {
        const scale = scales[key];
        mergeIf(scale, [defaults.scales[scale.type], defaults.scale]);
      });
      return scales;
    }
    function initOptions(config) {
      const options = config.options || (config.options = {});
      options.plugins = valueOrDefault(options.plugins, {});
      options.scales = mergeScaleConfig(config, options);
    }
    function initData(data) {
      data = data || {};
      data.datasets = data.datasets || [];
      data.labels = data.labels || [];
      return data;
    }
    function initConfig(config) {
      config = config || {};
      config.data = initData(config.data);
      initOptions(config);
      return config;
    }
    const keyCache = new Map();
    const keysCached = new Set();
    function cachedKeys(cacheKey, generate) {
      let keys = keyCache.get(cacheKey);
      if (!keys) {
        keys = generate();
        keyCache.set(cacheKey, keys);
        keysCached.add(keys);
      }
      return keys;
    }
    const addIfFound = (set, obj, key) => {
      const opts = resolveObjectKey(obj, key);
      if (opts !== undefined) {
        set.add(opts);
      }
    };
    class Config {
      constructor(config) {
        this._config = initConfig(config);
        this._scopeCache = new Map();
        this._resolverCache = new Map();
      }
      get platform() {
        return this._config.platform;
      }
      get type() {
        return this._config.type;
      }
      set type(type) {
        this._config.type = type;
      }
      get data() {
        return this._config.data;
      }
      set data(data) {
        this._config.data = initData(data);
      }
      get options() {
        return this._config.options;
      }
      set options(options) {
        this._config.options = options;
      }
      get plugins() {
        return this._config.plugins;
      }
      update() {
        const config = this._config;
        this.clearCache();
        initOptions(config);
      }
      clearCache() {
        this._scopeCache.clear();
        this._resolverCache.clear();
      }
      datasetScopeKeys(datasetType) {
        return cachedKeys(datasetType,
          () => [[
            `datasets.${datasetType}`,
            ''
          ]]);
      }
      datasetAnimationScopeKeys(datasetType, transition) {
        return cachedKeys(`${datasetType}.transition.${transition}`,
          () => [
            [
              `datasets.${datasetType}.transitions.${transition}`,
              `transitions.${transition}`,
            ],
            [
              `datasets.${datasetType}`,
              ''
            ]
          ]);
      }
      datasetElementScopeKeys(datasetType, elementType) {
        return cachedKeys(`${datasetType}-${elementType}`,
          () => [[
            `datasets.${datasetType}.elements.${elementType}`,
            `datasets.${datasetType}`,
            `elements.${elementType}`,
            ''
          ]]);
      }
      pluginScopeKeys(plugin) {
        const id = plugin.id;
        const type = this.type;
        return cachedKeys(`${type}-plugin-${id}`,
          () => [[
            `plugins.${id}`,
            ...plugin.additionalOptionScopes || [],
          ]]);
      }
      _cachedScopes(mainScope, resetCache) {
        const _scopeCache = this._scopeCache;
        let cache = _scopeCache.get(mainScope);
        if (!cache || resetCache) {
          cache = new Map();
          _scopeCache.set(mainScope, cache);
        }
        return cache;
      }
      getOptionScopes(mainScope, keyLists, resetCache) {
        const {options, type} = this;
        const cache = this._cachedScopes(mainScope, resetCache);
        const cached = cache.get(keyLists);
        if (cached) {
          return cached;
        }
        const scopes = new Set();
        keyLists.forEach(keys => {
          if (mainScope) {
            scopes.add(mainScope);
            keys.forEach(key => addIfFound(scopes, mainScope, key));
          }
          keys.forEach(key => addIfFound(scopes, options, key));
          keys.forEach(key => addIfFound(scopes, overrides[type] || {}, key));
          keys.forEach(key => addIfFound(scopes, defaults, key));
          keys.forEach(key => addIfFound(scopes, descriptors, key));
        });
        const array = Array.from(scopes);
        if (array.length === 0) {
          array.push(Object.create(null));
        }
        if (keysCached.has(keyLists)) {
          cache.set(keyLists, array);
        }
        return array;
      }
      chartOptionScopes() {
        const {options, type} = this;
        return [
          options,
          overrides[type] || {},
          defaults.datasets[type] || {},
          {type},
          defaults,
          descriptors
        ];
      }
      resolveNamedOptions(scopes, names, context, prefixes = ['']) {
        const result = {$shared: true};
        const {resolver, subPrefixes} = getResolver(this._resolverCache, scopes, prefixes);
        let options = resolver;
        if (needContext(resolver, names)) {
          result.$shared = false;
          context = isFunction(context) ? context() : context;
          const subResolver = this.createResolver(scopes, context, subPrefixes);
          options = _attachContext(resolver, context, subResolver);
        }
        for (const prop of names) {
          result[prop] = options[prop];
        }
        return result;
      }
      createResolver(scopes, context, prefixes = [''], descriptorDefaults) {
        const {resolver} = getResolver(this._resolverCache, scopes, prefixes);
        return isObject(context)
          ? _attachContext(resolver, context, undefined, descriptorDefaults)
          : resolver;
      }
    }
    function getResolver(resolverCache, scopes, prefixes) {
      let cache = resolverCache.get(scopes);
      if (!cache) {
        cache = new Map();
        resolverCache.set(scopes, cache);
      }
      const cacheKey = prefixes.join();
      let cached = cache.get(cacheKey);
      if (!cached) {
        const resolver = _createResolver(scopes, prefixes);
        cached = {
          resolver,
          subPrefixes: prefixes.filter(p => !p.toLowerCase().includes('hover'))
        };
        cache.set(cacheKey, cached);
      }
      return cached;
    }
    const hasFunction = value => isObject(value)
      && Object.getOwnPropertyNames(value).reduce((acc, key) => acc || isFunction(value[key]), false);
    function needContext(proxy, names) {
      const {isScriptable, isIndexable} = _descriptors(proxy);
      for (const prop of names) {
        const scriptable = isScriptable(prop);
        const indexable = isIndexable(prop);
        const value = (indexable || scriptable) && proxy[prop];
        if ((scriptable && (isFunction(value) || hasFunction(value)))
          || (indexable && isArray(value))) {
          return true;
        }
      }
      return false;
    }

    var version = "3.6.0";

    const KNOWN_POSITIONS = ['top', 'bottom', 'left', 'right', 'chartArea'];
    function positionIsHorizontal(position, axis) {
      return position === 'top' || position === 'bottom' || (KNOWN_POSITIONS.indexOf(position) === -1 && axis === 'x');
    }
    function compare2Level(l1, l2) {
      return function(a, b) {
        return a[l1] === b[l1]
          ? a[l2] - b[l2]
          : a[l1] - b[l1];
      };
    }
    function onAnimationsComplete(context) {
      const chart = context.chart;
      const animationOptions = chart.options.animation;
      chart.notifyPlugins('afterRender');
      callback(animationOptions && animationOptions.onComplete, [context], chart);
    }
    function onAnimationProgress(context) {
      const chart = context.chart;
      const animationOptions = chart.options.animation;
      callback(animationOptions && animationOptions.onProgress, [context], chart);
    }
    function getCanvas(item) {
      if (_isDomSupported() && typeof item === 'string') {
        item = document.getElementById(item);
      } else if (item && item.length) {
        item = item[0];
      }
      if (item && item.canvas) {
        item = item.canvas;
      }
      return item;
    }
    const instances = {};
    const getChart = (key) => {
      const canvas = getCanvas(key);
      return Object.values(instances).filter((c) => c.canvas === canvas).pop();
    };
    class Chart {
      constructor(item, userConfig) {
        const config = this.config = new Config(userConfig);
        const initialCanvas = getCanvas(item);
        const existingChart = getChart(initialCanvas);
        if (existingChart) {
          throw new Error(
            'Canvas is already in use. Chart with ID \'' + existingChart.id + '\'' +
    				' must be destroyed before the canvas can be reused.'
          );
        }
        const options = config.createResolver(config.chartOptionScopes(), this.getContext());
        this.platform = new (config.platform || _detectPlatform(initialCanvas))();
        this.platform.updateConfig(config);
        const context = this.platform.acquireContext(initialCanvas, options.aspectRatio);
        const canvas = context && context.canvas;
        const height = canvas && canvas.height;
        const width = canvas && canvas.width;
        this.id = uid();
        this.ctx = context;
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this._options = options;
        this._aspectRatio = this.aspectRatio;
        this._layers = [];
        this._metasets = [];
        this._stacks = undefined;
        this.boxes = [];
        this.currentDevicePixelRatio = undefined;
        this.chartArea = undefined;
        this._active = [];
        this._lastEvent = undefined;
        this._listeners = {};
        this._responsiveListeners = undefined;
        this._sortedMetasets = [];
        this.scales = {};
        this._plugins = new PluginService();
        this.$proxies = {};
        this._hiddenIndices = {};
        this.attached = false;
        this._animationsDisabled = undefined;
        this.$context = undefined;
        this._doResize = debounce(mode => this.update(mode), options.resizeDelay || 0);
        instances[this.id] = this;
        if (!context || !canvas) {
          console.error("Failed to create chart: can't acquire context from the given item");
          return;
        }
        animator.listen(this, 'complete', onAnimationsComplete);
        animator.listen(this, 'progress', onAnimationProgress);
        this._initialize();
        if (this.attached) {
          this.update();
        }
      }
      get aspectRatio() {
        const {options: {aspectRatio, maintainAspectRatio}, width, height, _aspectRatio} = this;
        if (!isNullOrUndef(aspectRatio)) {
          return aspectRatio;
        }
        if (maintainAspectRatio && _aspectRatio) {
          return _aspectRatio;
        }
        return height ? width / height : null;
      }
      get data() {
        return this.config.data;
      }
      set data(data) {
        this.config.data = data;
      }
      get options() {
        return this._options;
      }
      set options(options) {
        this.config.options = options;
      }
      _initialize() {
        this.notifyPlugins('beforeInit');
        if (this.options.responsive) {
          this.resize();
        } else {
          retinaScale(this, this.options.devicePixelRatio);
        }
        this.bindEvents();
        this.notifyPlugins('afterInit');
        return this;
      }
      clear() {
        clearCanvas(this.canvas, this.ctx);
        return this;
      }
      stop() {
        animator.stop(this);
        return this;
      }
      resize(width, height) {
        if (!animator.running(this)) {
          this._resize(width, height);
        } else {
          this._resizeBeforeDraw = {width, height};
        }
      }
      _resize(width, height) {
        const options = this.options;
        const canvas = this.canvas;
        const aspectRatio = options.maintainAspectRatio && this.aspectRatio;
        const newSize = this.platform.getMaximumSize(canvas, width, height, aspectRatio);
        const newRatio = options.devicePixelRatio || this.platform.getDevicePixelRatio();
        const mode = this.width ? 'resize' : 'attach';
        this.width = newSize.width;
        this.height = newSize.height;
        this._aspectRatio = this.aspectRatio;
        if (!retinaScale(this, newRatio, true)) {
          return;
        }
        this.notifyPlugins('resize', {size: newSize});
        callback(options.onResize, [this, newSize], this);
        if (this.attached) {
          if (this._doResize(mode)) {
            this.render();
          }
        }
      }
      ensureScalesHaveIDs() {
        const options = this.options;
        const scalesOptions = options.scales || {};
        each(scalesOptions, (axisOptions, axisID) => {
          axisOptions.id = axisID;
        });
      }
      buildOrUpdateScales() {
        const options = this.options;
        const scaleOpts = options.scales;
        const scales = this.scales;
        const updated = Object.keys(scales).reduce((obj, id) => {
          obj[id] = false;
          return obj;
        }, {});
        let items = [];
        if (scaleOpts) {
          items = items.concat(
            Object.keys(scaleOpts).map((id) => {
              const scaleOptions = scaleOpts[id];
              const axis = determineAxis(id, scaleOptions);
              const isRadial = axis === 'r';
              const isHorizontal = axis === 'x';
              return {
                options: scaleOptions,
                dposition: isRadial ? 'chartArea' : isHorizontal ? 'bottom' : 'left',
                dtype: isRadial ? 'radialLinear' : isHorizontal ? 'category' : 'linear'
              };
            })
          );
        }
        each(items, (item) => {
          const scaleOptions = item.options;
          const id = scaleOptions.id;
          const axis = determineAxis(id, scaleOptions);
          const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
          if (scaleOptions.position === undefined || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
            scaleOptions.position = item.dposition;
          }
          updated[id] = true;
          let scale = null;
          if (id in scales && scales[id].type === scaleType) {
            scale = scales[id];
          } else {
            const scaleClass = registry.getScale(scaleType);
            scale = new scaleClass({
              id,
              type: scaleType,
              ctx: this.ctx,
              chart: this
            });
            scales[scale.id] = scale;
          }
          scale.init(scaleOptions, options);
        });
        each(updated, (hasUpdated, id) => {
          if (!hasUpdated) {
            delete scales[id];
          }
        });
        each(scales, (scale) => {
          layouts.configure(this, scale, scale.options);
          layouts.addBox(this, scale);
        });
      }
      _updateMetasets() {
        const metasets = this._metasets;
        const numData = this.data.datasets.length;
        const numMeta = metasets.length;
        metasets.sort((a, b) => a.index - b.index);
        if (numMeta > numData) {
          for (let i = numData; i < numMeta; ++i) {
            this._destroyDatasetMeta(i);
          }
          metasets.splice(numData, numMeta - numData);
        }
        this._sortedMetasets = metasets.slice(0).sort(compare2Level('order', 'index'));
      }
      _removeUnreferencedMetasets() {
        const {_metasets: metasets, data: {datasets}} = this;
        if (metasets.length > datasets.length) {
          delete this._stacks;
        }
        metasets.forEach((meta, index) => {
          if (datasets.filter(x => x === meta._dataset).length === 0) {
            this._destroyDatasetMeta(index);
          }
        });
      }
      buildOrUpdateControllers() {
        const newControllers = [];
        const datasets = this.data.datasets;
        let i, ilen;
        this._removeUnreferencedMetasets();
        for (i = 0, ilen = datasets.length; i < ilen; i++) {
          const dataset = datasets[i];
          let meta = this.getDatasetMeta(i);
          const type = dataset.type || this.config.type;
          if (meta.type && meta.type !== type) {
            this._destroyDatasetMeta(i);
            meta = this.getDatasetMeta(i);
          }
          meta.type = type;
          meta.indexAxis = dataset.indexAxis || getIndexAxis(type, this.options);
          meta.order = dataset.order || 0;
          meta.index = i;
          meta.label = '' + dataset.label;
          meta.visible = this.isDatasetVisible(i);
          if (meta.controller) {
            meta.controller.updateIndex(i);
            meta.controller.linkScales();
          } else {
            const ControllerClass = registry.getController(type);
            const {datasetElementType, dataElementType} = defaults.datasets[type];
            Object.assign(ControllerClass.prototype, {
              dataElementType: registry.getElement(dataElementType),
              datasetElementType: datasetElementType && registry.getElement(datasetElementType)
            });
            meta.controller = new ControllerClass(this, i);
            newControllers.push(meta.controller);
          }
        }
        this._updateMetasets();
        return newControllers;
      }
      _resetElements() {
        each(this.data.datasets, (dataset, datasetIndex) => {
          this.getDatasetMeta(datasetIndex).controller.reset();
        }, this);
      }
      reset() {
        this._resetElements();
        this.notifyPlugins('reset');
      }
      update(mode) {
        const config = this.config;
        config.update();
        const options = this._options = config.createResolver(config.chartOptionScopes(), this.getContext());
        each(this.scales, (scale) => {
          layouts.removeBox(this, scale);
        });
        const animsDisabled = this._animationsDisabled = !options.animation;
        this.ensureScalesHaveIDs();
        this.buildOrUpdateScales();
        const existingEvents = new Set(Object.keys(this._listeners));
        const newEvents = new Set(options.events);
        if (!setsEqual(existingEvents, newEvents) || !!this._responsiveListeners !== options.responsive) {
          this.unbindEvents();
          this.bindEvents();
        }
        this._plugins.invalidate();
        if (this.notifyPlugins('beforeUpdate', {mode, cancelable: true}) === false) {
          return;
        }
        const newControllers = this.buildOrUpdateControllers();
        this.notifyPlugins('beforeElementsUpdate');
        let minPadding = 0;
        for (let i = 0, ilen = this.data.datasets.length; i < ilen; i++) {
          const {controller} = this.getDatasetMeta(i);
          const reset = !animsDisabled && newControllers.indexOf(controller) === -1;
          controller.buildOrUpdateElements(reset);
          minPadding = Math.max(+controller.getMaxOverflow(), minPadding);
        }
        minPadding = this._minPadding = options.layout.autoPadding ? minPadding : 0;
        this._updateLayout(minPadding);
        if (!animsDisabled) {
          each(newControllers, (controller) => {
            controller.reset();
          });
        }
        this._updateDatasets(mode);
        this.notifyPlugins('afterUpdate', {mode});
        this._layers.sort(compare2Level('z', '_idx'));
        if (this._lastEvent) {
          this._eventHandler(this._lastEvent, true);
        }
        this.render();
      }
      _updateLayout(minPadding) {
        if (this.notifyPlugins('beforeLayout', {cancelable: true}) === false) {
          return;
        }
        layouts.update(this, this.width, this.height, minPadding);
        const area = this.chartArea;
        const noArea = area.width <= 0 || area.height <= 0;
        this._layers = [];
        each(this.boxes, (box) => {
          if (noArea && box.position === 'chartArea') {
            return;
          }
          if (box.configure) {
            box.configure();
          }
          this._layers.push(...box._layers());
        }, this);
        this._layers.forEach((item, index) => {
          item._idx = index;
        });
        this.notifyPlugins('afterLayout');
      }
      _updateDatasets(mode) {
        if (this.notifyPlugins('beforeDatasetsUpdate', {mode, cancelable: true}) === false) {
          return;
        }
        for (let i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
          this._updateDataset(i, isFunction(mode) ? mode({datasetIndex: i}) : mode);
        }
        this.notifyPlugins('afterDatasetsUpdate', {mode});
      }
      _updateDataset(index, mode) {
        const meta = this.getDatasetMeta(index);
        const args = {meta, index, mode, cancelable: true};
        if (this.notifyPlugins('beforeDatasetUpdate', args) === false) {
          return;
        }
        meta.controller._update(mode);
        args.cancelable = false;
        this.notifyPlugins('afterDatasetUpdate', args);
      }
      render() {
        if (this.notifyPlugins('beforeRender', {cancelable: true}) === false) {
          return;
        }
        if (animator.has(this)) {
          if (this.attached && !animator.running(this)) {
            animator.start(this);
          }
        } else {
          this.draw();
          onAnimationsComplete({chart: this});
        }
      }
      draw() {
        let i;
        if (this._resizeBeforeDraw) {
          const {width, height} = this._resizeBeforeDraw;
          this._resize(width, height);
          this._resizeBeforeDraw = null;
        }
        this.clear();
        if (this.width <= 0 || this.height <= 0) {
          return;
        }
        if (this.notifyPlugins('beforeDraw', {cancelable: true}) === false) {
          return;
        }
        const layers = this._layers;
        for (i = 0; i < layers.length && layers[i].z <= 0; ++i) {
          layers[i].draw(this.chartArea);
        }
        this._drawDatasets();
        for (; i < layers.length; ++i) {
          layers[i].draw(this.chartArea);
        }
        this.notifyPlugins('afterDraw');
      }
      _getSortedDatasetMetas(filterVisible) {
        const metasets = this._sortedMetasets;
        const result = [];
        let i, ilen;
        for (i = 0, ilen = metasets.length; i < ilen; ++i) {
          const meta = metasets[i];
          if (!filterVisible || meta.visible) {
            result.push(meta);
          }
        }
        return result;
      }
      getSortedVisibleDatasetMetas() {
        return this._getSortedDatasetMetas(true);
      }
      _drawDatasets() {
        if (this.notifyPlugins('beforeDatasetsDraw', {cancelable: true}) === false) {
          return;
        }
        const metasets = this.getSortedVisibleDatasetMetas();
        for (let i = metasets.length - 1; i >= 0; --i) {
          this._drawDataset(metasets[i]);
        }
        this.notifyPlugins('afterDatasetsDraw');
      }
      _drawDataset(meta) {
        const ctx = this.ctx;
        const clip = meta._clip;
        const useClip = !clip.disabled;
        const area = this.chartArea;
        const args = {
          meta,
          index: meta.index,
          cancelable: true
        };
        if (this.notifyPlugins('beforeDatasetDraw', args) === false) {
          return;
        }
        if (useClip) {
          clipArea(ctx, {
            left: clip.left === false ? 0 : area.left - clip.left,
            right: clip.right === false ? this.width : area.right + clip.right,
            top: clip.top === false ? 0 : area.top - clip.top,
            bottom: clip.bottom === false ? this.height : area.bottom + clip.bottom
          });
        }
        meta.controller.draw();
        if (useClip) {
          unclipArea(ctx);
        }
        args.cancelable = false;
        this.notifyPlugins('afterDatasetDraw', args);
      }
      getElementsAtEventForMode(e, mode, options, useFinalPosition) {
        const method = Interaction.modes[mode];
        if (typeof method === 'function') {
          return method(this, e, options, useFinalPosition);
        }
        return [];
      }
      getDatasetMeta(datasetIndex) {
        const dataset = this.data.datasets[datasetIndex];
        const metasets = this._metasets;
        let meta = metasets.filter(x => x && x._dataset === dataset).pop();
        if (!meta) {
          meta = {
            type: null,
            data: [],
            dataset: null,
            controller: null,
            hidden: null,
            xAxisID: null,
            yAxisID: null,
            order: dataset && dataset.order || 0,
            index: datasetIndex,
            _dataset: dataset,
            _parsed: [],
            _sorted: false
          };
          metasets.push(meta);
        }
        return meta;
      }
      getContext() {
        return this.$context || (this.$context = createContext(null, {chart: this, type: 'chart'}));
      }
      getVisibleDatasetCount() {
        return this.getSortedVisibleDatasetMetas().length;
      }
      isDatasetVisible(datasetIndex) {
        const dataset = this.data.datasets[datasetIndex];
        if (!dataset) {
          return false;
        }
        const meta = this.getDatasetMeta(datasetIndex);
        return typeof meta.hidden === 'boolean' ? !meta.hidden : !dataset.hidden;
      }
      setDatasetVisibility(datasetIndex, visible) {
        const meta = this.getDatasetMeta(datasetIndex);
        meta.hidden = !visible;
      }
      toggleDataVisibility(index) {
        this._hiddenIndices[index] = !this._hiddenIndices[index];
      }
      getDataVisibility(index) {
        return !this._hiddenIndices[index];
      }
      _updateVisibility(datasetIndex, dataIndex, visible) {
        const mode = visible ? 'show' : 'hide';
        const meta = this.getDatasetMeta(datasetIndex);
        const anims = meta.controller._resolveAnimations(undefined, mode);
        if (defined(dataIndex)) {
          meta.data[dataIndex].hidden = !visible;
          this.update();
        } else {
          this.setDatasetVisibility(datasetIndex, visible);
          anims.update(meta, {visible});
          this.update((ctx) => ctx.datasetIndex === datasetIndex ? mode : undefined);
        }
      }
      hide(datasetIndex, dataIndex) {
        this._updateVisibility(datasetIndex, dataIndex, false);
      }
      show(datasetIndex, dataIndex) {
        this._updateVisibility(datasetIndex, dataIndex, true);
      }
      _destroyDatasetMeta(datasetIndex) {
        const meta = this._metasets[datasetIndex];
        if (meta && meta.controller) {
          meta.controller._destroy();
        }
        delete this._metasets[datasetIndex];
      }
      _stop() {
        let i, ilen;
        this.stop();
        animator.remove(this);
        for (i = 0, ilen = this.data.datasets.length; i < ilen; ++i) {
          this._destroyDatasetMeta(i);
        }
      }
      destroy() {
        const {canvas, ctx} = this;
        this._stop();
        this.config.clearCache();
        if (canvas) {
          this.unbindEvents();
          clearCanvas(canvas, ctx);
          this.platform.releaseContext(ctx);
          this.canvas = null;
          this.ctx = null;
        }
        this.notifyPlugins('destroy');
        delete instances[this.id];
      }
      toBase64Image(...args) {
        return this.canvas.toDataURL(...args);
      }
      bindEvents() {
        this.bindUserEvents();
        if (this.options.responsive) {
          this.bindResponsiveEvents();
        } else {
          this.attached = true;
        }
      }
      bindUserEvents() {
        const listeners = this._listeners;
        const platform = this.platform;
        const _add = (type, listener) => {
          platform.addEventListener(this, type, listener);
          listeners[type] = listener;
        };
        const listener = (e, x, y) => {
          e.offsetX = x;
          e.offsetY = y;
          this._eventHandler(e);
        };
        each(this.options.events, (type) => _add(type, listener));
      }
      bindResponsiveEvents() {
        if (!this._responsiveListeners) {
          this._responsiveListeners = {};
        }
        const listeners = this._responsiveListeners;
        const platform = this.platform;
        const _add = (type, listener) => {
          platform.addEventListener(this, type, listener);
          listeners[type] = listener;
        };
        const _remove = (type, listener) => {
          if (listeners[type]) {
            platform.removeEventListener(this, type, listener);
            delete listeners[type];
          }
        };
        const listener = (width, height) => {
          if (this.canvas) {
            this.resize(width, height);
          }
        };
        let detached;
        const attached = () => {
          _remove('attach', attached);
          this.attached = true;
          this.resize();
          _add('resize', listener);
          _add('detach', detached);
        };
        detached = () => {
          this.attached = false;
          _remove('resize', listener);
          this._stop();
          this._resize(0, 0);
          _add('attach', attached);
        };
        if (platform.isAttached(this.canvas)) {
          attached();
        } else {
          detached();
        }
      }
      unbindEvents() {
        each(this._listeners, (listener, type) => {
          this.platform.removeEventListener(this, type, listener);
        });
        this._listeners = {};
        each(this._responsiveListeners, (listener, type) => {
          this.platform.removeEventListener(this, type, listener);
        });
        this._responsiveListeners = undefined;
      }
      updateHoverStyle(items, mode, enabled) {
        const prefix = enabled ? 'set' : 'remove';
        let meta, item, i, ilen;
        if (mode === 'dataset') {
          meta = this.getDatasetMeta(items[0].datasetIndex);
          meta.controller['_' + prefix + 'DatasetHoverStyle']();
        }
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          item = items[i];
          const controller = item && this.getDatasetMeta(item.datasetIndex).controller;
          if (controller) {
            controller[prefix + 'HoverStyle'](item.element, item.datasetIndex, item.index);
          }
        }
      }
      getActiveElements() {
        return this._active || [];
      }
      setActiveElements(activeElements) {
        const lastActive = this._active || [];
        const active = activeElements.map(({datasetIndex, index}) => {
          const meta = this.getDatasetMeta(datasetIndex);
          if (!meta) {
            throw new Error('No dataset found at index ' + datasetIndex);
          }
          return {
            datasetIndex,
            element: meta.data[index],
            index,
          };
        });
        const changed = !_elementsEqual(active, lastActive);
        if (changed) {
          this._active = active;
          this._updateHoverStyles(active, lastActive);
        }
      }
      notifyPlugins(hook, args, filter) {
        return this._plugins.notify(this, hook, args, filter);
      }
      _updateHoverStyles(active, lastActive, replay) {
        const hoverOptions = this.options.hover;
        const diff = (a, b) => a.filter(x => !b.some(y => x.datasetIndex === y.datasetIndex && x.index === y.index));
        const deactivated = diff(lastActive, active);
        const activated = replay ? active : diff(active, lastActive);
        if (deactivated.length) {
          this.updateHoverStyle(deactivated, hoverOptions.mode, false);
        }
        if (activated.length && hoverOptions.mode) {
          this.updateHoverStyle(activated, hoverOptions.mode, true);
        }
      }
      _eventHandler(e, replay) {
        const args = {event: e, replay, cancelable: true};
        const eventFilter = (plugin) => (plugin.options.events || this.options.events).includes(e.native.type);
        if (this.notifyPlugins('beforeEvent', args, eventFilter) === false) {
          return;
        }
        const changed = this._handleEvent(e, replay);
        args.cancelable = false;
        this.notifyPlugins('afterEvent', args, eventFilter);
        if (changed || args.changed) {
          this.render();
        }
        return this;
      }
      _handleEvent(e, replay) {
        const {_active: lastActive = [], options} = this;
        const hoverOptions = options.hover;
        const useFinalPosition = replay;
        let active = [];
        let changed = false;
        let lastEvent = null;
        if (e.type !== 'mouseout') {
          active = this.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions, useFinalPosition);
          lastEvent = e.type === 'click' ? this._lastEvent : e;
        }
        this._lastEvent = null;
        if (_isPointInArea(e, this.chartArea, this._minPadding)) {
          callback(options.onHover, [e, active, this], this);
          if (e.type === 'mouseup' || e.type === 'click' || e.type === 'contextmenu') {
            callback(options.onClick, [e, active, this], this);
          }
        }
        changed = !_elementsEqual(active, lastActive);
        if (changed || replay) {
          this._active = active;
          this._updateHoverStyles(active, lastActive, replay);
        }
        this._lastEvent = lastEvent;
        return changed;
      }
    }
    const invalidatePlugins = () => each(Chart.instances, (chart) => chart._plugins.invalidate());
    const enumerable = true;
    Object.defineProperties(Chart, {
      defaults: {
        enumerable,
        value: defaults
      },
      instances: {
        enumerable,
        value: instances
      },
      overrides: {
        enumerable,
        value: overrides
      },
      registry: {
        enumerable,
        value: registry
      },
      version: {
        enumerable,
        value: version
      },
      getChart: {
        enumerable,
        value: getChart
      },
      register: {
        enumerable,
        value: (...items) => {
          registry.add(...items);
          invalidatePlugins();
        }
      },
      unregister: {
        enumerable,
        value: (...items) => {
          registry.remove(...items);
          invalidatePlugins();
        }
      }
    });

    function clipArc(ctx, element, endAngle) {
      const {startAngle, pixelMargin, x, y, outerRadius, innerRadius} = element;
      let angleMargin = pixelMargin / outerRadius;
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, startAngle - angleMargin, endAngle + angleMargin);
      if (innerRadius > pixelMargin) {
        angleMargin = pixelMargin / innerRadius;
        ctx.arc(x, y, innerRadius, endAngle + angleMargin, startAngle - angleMargin, true);
      } else {
        ctx.arc(x, y, pixelMargin, endAngle + HALF_PI, startAngle - HALF_PI);
      }
      ctx.closePath();
      ctx.clip();
    }
    function toRadiusCorners(value) {
      return _readValueToProps(value, ['outerStart', 'outerEnd', 'innerStart', 'innerEnd']);
    }
    function parseBorderRadius$1(arc, innerRadius, outerRadius, angleDelta) {
      const o = toRadiusCorners(arc.options.borderRadius);
      const halfThickness = (outerRadius - innerRadius) / 2;
      const innerLimit = Math.min(halfThickness, angleDelta * innerRadius / 2);
      const computeOuterLimit = (val) => {
        const outerArcLimit = (outerRadius - Math.min(halfThickness, val)) * angleDelta / 2;
        return _limitValue(val, 0, Math.min(halfThickness, outerArcLimit));
      };
      return {
        outerStart: computeOuterLimit(o.outerStart),
        outerEnd: computeOuterLimit(o.outerEnd),
        innerStart: _limitValue(o.innerStart, 0, innerLimit),
        innerEnd: _limitValue(o.innerEnd, 0, innerLimit),
      };
    }
    function rThetaToXY(r, theta, x, y) {
      return {
        x: x + r * Math.cos(theta),
        y: y + r * Math.sin(theta),
      };
    }
    function pathArc(ctx, element, offset, spacing, end) {
      const {x, y, startAngle: start, pixelMargin, innerRadius: innerR} = element;
      const outerRadius = Math.max(element.outerRadius + spacing + offset - pixelMargin, 0);
      const innerRadius = innerR > 0 ? innerR + spacing + offset + pixelMargin : 0;
      let spacingOffset = 0;
      const alpha = end - start;
      if (spacing) {
        const noSpacingInnerRadius = innerR > 0 ? innerR - spacing : 0;
        const noSpacingOuterRadius = outerRadius > 0 ? outerRadius - spacing : 0;
        const avNogSpacingRadius = (noSpacingInnerRadius + noSpacingOuterRadius) / 2;
        const adjustedAngle = avNogSpacingRadius !== 0 ? (alpha * avNogSpacingRadius) / (avNogSpacingRadius + spacing) : alpha;
        spacingOffset = (alpha - adjustedAngle) / 2;
      }
      const beta = Math.max(0.001, alpha * outerRadius - offset / PI) / outerRadius;
      const angleOffset = (alpha - beta) / 2;
      const startAngle = start + angleOffset + spacingOffset;
      const endAngle = end - angleOffset - spacingOffset;
      const {outerStart, outerEnd, innerStart, innerEnd} = parseBorderRadius$1(element, innerRadius, outerRadius, endAngle - startAngle);
      const outerStartAdjustedRadius = outerRadius - outerStart;
      const outerEndAdjustedRadius = outerRadius - outerEnd;
      const outerStartAdjustedAngle = startAngle + outerStart / outerStartAdjustedRadius;
      const outerEndAdjustedAngle = endAngle - outerEnd / outerEndAdjustedRadius;
      const innerStartAdjustedRadius = innerRadius + innerStart;
      const innerEndAdjustedRadius = innerRadius + innerEnd;
      const innerStartAdjustedAngle = startAngle + innerStart / innerStartAdjustedRadius;
      const innerEndAdjustedAngle = endAngle - innerEnd / innerEndAdjustedRadius;
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, outerStartAdjustedAngle, outerEndAdjustedAngle);
      if (outerEnd > 0) {
        const pCenter = rThetaToXY(outerEndAdjustedRadius, outerEndAdjustedAngle, x, y);
        ctx.arc(pCenter.x, pCenter.y, outerEnd, outerEndAdjustedAngle, endAngle + HALF_PI);
      }
      const p4 = rThetaToXY(innerEndAdjustedRadius, endAngle, x, y);
      ctx.lineTo(p4.x, p4.y);
      if (innerEnd > 0) {
        const pCenter = rThetaToXY(innerEndAdjustedRadius, innerEndAdjustedAngle, x, y);
        ctx.arc(pCenter.x, pCenter.y, innerEnd, endAngle + HALF_PI, innerEndAdjustedAngle + Math.PI);
      }
      ctx.arc(x, y, innerRadius, endAngle - (innerEnd / innerRadius), startAngle + (innerStart / innerRadius), true);
      if (innerStart > 0) {
        const pCenter = rThetaToXY(innerStartAdjustedRadius, innerStartAdjustedAngle, x, y);
        ctx.arc(pCenter.x, pCenter.y, innerStart, innerStartAdjustedAngle + Math.PI, startAngle - HALF_PI);
      }
      const p8 = rThetaToXY(outerStartAdjustedRadius, startAngle, x, y);
      ctx.lineTo(p8.x, p8.y);
      if (outerStart > 0) {
        const pCenter = rThetaToXY(outerStartAdjustedRadius, outerStartAdjustedAngle, x, y);
        ctx.arc(pCenter.x, pCenter.y, outerStart, startAngle - HALF_PI, outerStartAdjustedAngle);
      }
      ctx.closePath();
    }
    function drawArc(ctx, element, offset, spacing) {
      const {fullCircles, startAngle, circumference} = element;
      let endAngle = element.endAngle;
      if (fullCircles) {
        pathArc(ctx, element, offset, spacing, startAngle + TAU);
        for (let i = 0; i < fullCircles; ++i) {
          ctx.fill();
        }
        if (!isNaN(circumference)) {
          endAngle = startAngle + circumference % TAU;
          if (circumference % TAU === 0) {
            endAngle += TAU;
          }
        }
      }
      pathArc(ctx, element, offset, spacing, endAngle);
      ctx.fill();
      return endAngle;
    }
    function drawFullCircleBorders(ctx, element, inner) {
      const {x, y, startAngle, pixelMargin, fullCircles} = element;
      const outerRadius = Math.max(element.outerRadius - pixelMargin, 0);
      const innerRadius = element.innerRadius + pixelMargin;
      let i;
      if (inner) {
        clipArc(ctx, element, startAngle + TAU);
      }
      ctx.beginPath();
      ctx.arc(x, y, innerRadius, startAngle + TAU, startAngle, true);
      for (i = 0; i < fullCircles; ++i) {
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, outerRadius, startAngle, startAngle + TAU);
      for (i = 0; i < fullCircles; ++i) {
        ctx.stroke();
      }
    }
    function drawBorder(ctx, element, offset, spacing, endAngle) {
      const {options} = element;
      const inner = options.borderAlign === 'inner';
      if (!options.borderWidth) {
        return;
      }
      if (inner) {
        ctx.lineWidth = options.borderWidth * 2;
        ctx.lineJoin = 'round';
      } else {
        ctx.lineWidth = options.borderWidth;
        ctx.lineJoin = 'bevel';
      }
      if (element.fullCircles) {
        drawFullCircleBorders(ctx, element, inner);
      }
      if (inner) {
        clipArc(ctx, element, endAngle);
      }
      pathArc(ctx, element, offset, spacing, endAngle);
      ctx.stroke();
    }
    class ArcElement extends Element {
      constructor(cfg) {
        super();
        this.options = undefined;
        this.circumference = undefined;
        this.startAngle = undefined;
        this.endAngle = undefined;
        this.innerRadius = undefined;
        this.outerRadius = undefined;
        this.pixelMargin = 0;
        this.fullCircles = 0;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      inRange(chartX, chartY, useFinalPosition) {
        const point = this.getProps(['x', 'y'], useFinalPosition);
        const {angle, distance} = getAngleFromPoint(point, {x: chartX, y: chartY});
        const {startAngle, endAngle, innerRadius, outerRadius, circumference} = this.getProps([
          'startAngle',
          'endAngle',
          'innerRadius',
          'outerRadius',
          'circumference'
        ], useFinalPosition);
        const rAdjust = this.options.spacing / 2;
        const betweenAngles = circumference >= TAU || _angleBetween(angle, startAngle, endAngle);
        const withinRadius = (distance >= innerRadius + rAdjust && distance <= outerRadius + rAdjust);
        return (betweenAngles && withinRadius);
      }
      getCenterPoint(useFinalPosition) {
        const {x, y, startAngle, endAngle, innerRadius, outerRadius} = this.getProps([
          'x',
          'y',
          'startAngle',
          'endAngle',
          'innerRadius',
          'outerRadius',
          'circumference',
        ], useFinalPosition);
        const {offset, spacing} = this.options;
        const halfAngle = (startAngle + endAngle) / 2;
        const halfRadius = (innerRadius + outerRadius + spacing + offset) / 2;
        return {
          x: x + Math.cos(halfAngle) * halfRadius,
          y: y + Math.sin(halfAngle) * halfRadius
        };
      }
      tooltipPosition(useFinalPosition) {
        return this.getCenterPoint(useFinalPosition);
      }
      draw(ctx) {
        const {options, circumference} = this;
        const offset = (options.offset || 0) / 2;
        const spacing = (options.spacing || 0) / 2;
        this.pixelMargin = (options.borderAlign === 'inner') ? 0.33 : 0;
        this.fullCircles = circumference > TAU ? Math.floor(circumference / TAU) : 0;
        if (circumference === 0 || this.innerRadius < 0 || this.outerRadius < 0) {
          return;
        }
        ctx.save();
        let radiusOffset = 0;
        if (offset) {
          radiusOffset = offset / 2;
          const halfAngle = (this.startAngle + this.endAngle) / 2;
          ctx.translate(Math.cos(halfAngle) * radiusOffset, Math.sin(halfAngle) * radiusOffset);
          if (this.circumference >= PI) {
            radiusOffset = offset;
          }
        }
        ctx.fillStyle = options.backgroundColor;
        ctx.strokeStyle = options.borderColor;
        const endAngle = drawArc(ctx, this, radiusOffset, spacing);
        drawBorder(ctx, this, radiusOffset, spacing, endAngle);
        ctx.restore();
      }
    }
    ArcElement.id = 'arc';
    ArcElement.defaults = {
      borderAlign: 'center',
      borderColor: '#fff',
      borderRadius: 0,
      borderWidth: 2,
      offset: 0,
      spacing: 0,
      angle: undefined,
    };
    ArcElement.defaultRoutes = {
      backgroundColor: 'backgroundColor'
    };

    function setStyle(ctx, options, style = options) {
      ctx.lineCap = valueOrDefault(style.borderCapStyle, options.borderCapStyle);
      ctx.setLineDash(valueOrDefault(style.borderDash, options.borderDash));
      ctx.lineDashOffset = valueOrDefault(style.borderDashOffset, options.borderDashOffset);
      ctx.lineJoin = valueOrDefault(style.borderJoinStyle, options.borderJoinStyle);
      ctx.lineWidth = valueOrDefault(style.borderWidth, options.borderWidth);
      ctx.strokeStyle = valueOrDefault(style.borderColor, options.borderColor);
    }
    function lineTo(ctx, previous, target) {
      ctx.lineTo(target.x, target.y);
    }
    function getLineMethod(options) {
      if (options.stepped) {
        return _steppedLineTo;
      }
      if (options.tension || options.cubicInterpolationMode === 'monotone') {
        return _bezierCurveTo;
      }
      return lineTo;
    }
    function pathVars(points, segment, params = {}) {
      const count = points.length;
      const {start: paramsStart = 0, end: paramsEnd = count - 1} = params;
      const {start: segmentStart, end: segmentEnd} = segment;
      const start = Math.max(paramsStart, segmentStart);
      const end = Math.min(paramsEnd, segmentEnd);
      const outside = paramsStart < segmentStart && paramsEnd < segmentStart || paramsStart > segmentEnd && paramsEnd > segmentEnd;
      return {
        count,
        start,
        loop: segment.loop,
        ilen: end < start && !outside ? count + end - start : end - start
      };
    }
    function pathSegment(ctx, line, segment, params) {
      const {points, options} = line;
      const {count, start, loop, ilen} = pathVars(points, segment, params);
      const lineMethod = getLineMethod(options);
      let {move = true, reverse} = params || {};
      let i, point, prev;
      for (i = 0; i <= ilen; ++i) {
        point = points[(start + (reverse ? ilen - i : i)) % count];
        if (point.skip) {
          continue;
        } else if (move) {
          ctx.moveTo(point.x, point.y);
          move = false;
        } else {
          lineMethod(ctx, prev, point, reverse, options.stepped);
        }
        prev = point;
      }
      if (loop) {
        point = points[(start + (reverse ? ilen : 0)) % count];
        lineMethod(ctx, prev, point, reverse, options.stepped);
      }
      return !!loop;
    }
    function fastPathSegment(ctx, line, segment, params) {
      const points = line.points;
      const {count, start, ilen} = pathVars(points, segment, params);
      const {move = true, reverse} = params || {};
      let avgX = 0;
      let countX = 0;
      let i, point, prevX, minY, maxY, lastY;
      const pointIndex = (index) => (start + (reverse ? ilen - index : index)) % count;
      const drawX = () => {
        if (minY !== maxY) {
          ctx.lineTo(avgX, maxY);
          ctx.lineTo(avgX, minY);
          ctx.lineTo(avgX, lastY);
        }
      };
      if (move) {
        point = points[pointIndex(0)];
        ctx.moveTo(point.x, point.y);
      }
      for (i = 0; i <= ilen; ++i) {
        point = points[pointIndex(i)];
        if (point.skip) {
          continue;
        }
        const x = point.x;
        const y = point.y;
        const truncX = x | 0;
        if (truncX === prevX) {
          if (y < minY) {
            minY = y;
          } else if (y > maxY) {
            maxY = y;
          }
          avgX = (countX * avgX + x) / ++countX;
        } else {
          drawX();
          ctx.lineTo(x, y);
          prevX = truncX;
          countX = 0;
          minY = maxY = y;
        }
        lastY = y;
      }
      drawX();
    }
    function _getSegmentMethod(line) {
      const opts = line.options;
      const borderDash = opts.borderDash && opts.borderDash.length;
      const useFastPath = !line._decimated && !line._loop && !opts.tension && opts.cubicInterpolationMode !== 'monotone' && !opts.stepped && !borderDash;
      return useFastPath ? fastPathSegment : pathSegment;
    }
    function _getInterpolationMethod(options) {
      if (options.stepped) {
        return _steppedInterpolation;
      }
      if (options.tension || options.cubicInterpolationMode === 'monotone') {
        return _bezierInterpolation;
      }
      return _pointInLine;
    }
    function strokePathWithCache(ctx, line, start, count) {
      let path = line._path;
      if (!path) {
        path = line._path = new Path2D();
        if (line.path(path, start, count)) {
          path.closePath();
        }
      }
      setStyle(ctx, line.options);
      ctx.stroke(path);
    }
    function strokePathDirect(ctx, line, start, count) {
      const {segments, options} = line;
      const segmentMethod = _getSegmentMethod(line);
      for (const segment of segments) {
        setStyle(ctx, options, segment.style);
        ctx.beginPath();
        if (segmentMethod(ctx, line, segment, {start, end: start + count - 1})) {
          ctx.closePath();
        }
        ctx.stroke();
      }
    }
    const usePath2D = typeof Path2D === 'function';
    function draw(ctx, line, start, count) {
      if (usePath2D && !line.options.segment) {
        strokePathWithCache(ctx, line, start, count);
      } else {
        strokePathDirect(ctx, line, start, count);
      }
    }
    class LineElement extends Element {
      constructor(cfg) {
        super();
        this.animated = true;
        this.options = undefined;
        this._chart = undefined;
        this._loop = undefined;
        this._fullLoop = undefined;
        this._path = undefined;
        this._points = undefined;
        this._segments = undefined;
        this._decimated = false;
        this._pointsUpdated = false;
        this._datasetIndex = undefined;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      updateControlPoints(chartArea, indexAxis) {
        const options = this.options;
        if ((options.tension || options.cubicInterpolationMode === 'monotone') && !options.stepped && !this._pointsUpdated) {
          const loop = options.spanGaps ? this._loop : this._fullLoop;
          _updateBezierControlPoints(this._points, options, chartArea, loop, indexAxis);
          this._pointsUpdated = true;
        }
      }
      set points(points) {
        this._points = points;
        delete this._segments;
        delete this._path;
        this._pointsUpdated = false;
      }
      get points() {
        return this._points;
      }
      get segments() {
        return this._segments || (this._segments = _computeSegments(this, this.options.segment));
      }
      first() {
        const segments = this.segments;
        const points = this.points;
        return segments.length && points[segments[0].start];
      }
      last() {
        const segments = this.segments;
        const points = this.points;
        const count = segments.length;
        return count && points[segments[count - 1].end];
      }
      interpolate(point, property) {
        const options = this.options;
        const value = point[property];
        const points = this.points;
        const segments = _boundSegments(this, {property, start: value, end: value});
        if (!segments.length) {
          return;
        }
        const result = [];
        const _interpolate = _getInterpolationMethod(options);
        let i, ilen;
        for (i = 0, ilen = segments.length; i < ilen; ++i) {
          const {start, end} = segments[i];
          const p1 = points[start];
          const p2 = points[end];
          if (p1 === p2) {
            result.push(p1);
            continue;
          }
          const t = Math.abs((value - p1[property]) / (p2[property] - p1[property]));
          const interpolated = _interpolate(p1, p2, t, options.stepped);
          interpolated[property] = point[property];
          result.push(interpolated);
        }
        return result.length === 1 ? result[0] : result;
      }
      pathSegment(ctx, segment, params) {
        const segmentMethod = _getSegmentMethod(this);
        return segmentMethod(ctx, this, segment, params);
      }
      path(ctx, start, count) {
        const segments = this.segments;
        const segmentMethod = _getSegmentMethod(this);
        let loop = this._loop;
        start = start || 0;
        count = count || (this.points.length - start);
        for (const segment of segments) {
          loop &= segmentMethod(ctx, this, segment, {start, end: start + count - 1});
        }
        return !!loop;
      }
      draw(ctx, chartArea, start, count) {
        const options = this.options || {};
        const points = this.points || [];
        if (points.length && options.borderWidth) {
          ctx.save();
          draw(ctx, this, start, count);
          ctx.restore();
        }
        if (this.animated) {
          this._pointsUpdated = false;
          this._path = undefined;
        }
      }
    }
    LineElement.id = 'line';
    LineElement.defaults = {
      borderCapStyle: 'butt',
      borderDash: [],
      borderDashOffset: 0,
      borderJoinStyle: 'miter',
      borderWidth: 3,
      capBezierPoints: true,
      cubicInterpolationMode: 'default',
      fill: false,
      spanGaps: false,
      stepped: false,
      tension: 0,
    };
    LineElement.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    };
    LineElement.descriptors = {
      _scriptable: true,
      _indexable: (name) => name !== 'borderDash' && name !== 'fill',
    };

    function inRange$1(el, pos, axis, useFinalPosition) {
      const options = el.options;
      const {[axis]: value} = el.getProps([axis], useFinalPosition);
      return (Math.abs(pos - value) < options.radius + options.hitRadius);
    }
    class PointElement extends Element {
      constructor(cfg) {
        super();
        this.options = undefined;
        this.parsed = undefined;
        this.skip = undefined;
        this.stop = undefined;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      inRange(mouseX, mouseY, useFinalPosition) {
        const options = this.options;
        const {x, y} = this.getProps(['x', 'y'], useFinalPosition);
        return ((Math.pow(mouseX - x, 2) + Math.pow(mouseY - y, 2)) < Math.pow(options.hitRadius + options.radius, 2));
      }
      inXRange(mouseX, useFinalPosition) {
        return inRange$1(this, mouseX, 'x', useFinalPosition);
      }
      inYRange(mouseY, useFinalPosition) {
        return inRange$1(this, mouseY, 'y', useFinalPosition);
      }
      getCenterPoint(useFinalPosition) {
        const {x, y} = this.getProps(['x', 'y'], useFinalPosition);
        return {x, y};
      }
      size(options) {
        options = options || this.options || {};
        let radius = options.radius || 0;
        radius = Math.max(radius, radius && options.hoverRadius || 0);
        const borderWidth = radius && options.borderWidth || 0;
        return (radius + borderWidth) * 2;
      }
      draw(ctx, area) {
        const options = this.options;
        if (this.skip || options.radius < 0.1 || !_isPointInArea(this, area, this.size(options) / 2)) {
          return;
        }
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.fillStyle = options.backgroundColor;
        drawPoint(ctx, options, this.x, this.y);
      }
      getRange() {
        const options = this.options || {};
        return options.radius + options.hitRadius;
      }
    }
    PointElement.id = 'point';
    PointElement.defaults = {
      borderWidth: 1,
      hitRadius: 1,
      hoverBorderWidth: 1,
      hoverRadius: 4,
      pointStyle: 'circle',
      radius: 3,
      rotation: 0
    };
    PointElement.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    };

    function getBarBounds(bar, useFinalPosition) {
      const {x, y, base, width, height} = bar.getProps(['x', 'y', 'base', 'width', 'height'], useFinalPosition);
      let left, right, top, bottom, half;
      if (bar.horizontal) {
        half = height / 2;
        left = Math.min(x, base);
        right = Math.max(x, base);
        top = y - half;
        bottom = y + half;
      } else {
        half = width / 2;
        left = x - half;
        right = x + half;
        top = Math.min(y, base);
        bottom = Math.max(y, base);
      }
      return {left, top, right, bottom};
    }
    function skipOrLimit(skip, value, min, max) {
      return skip ? 0 : _limitValue(value, min, max);
    }
    function parseBorderWidth(bar, maxW, maxH) {
      const value = bar.options.borderWidth;
      const skip = bar.borderSkipped;
      const o = toTRBL(value);
      return {
        t: skipOrLimit(skip.top, o.top, 0, maxH),
        r: skipOrLimit(skip.right, o.right, 0, maxW),
        b: skipOrLimit(skip.bottom, o.bottom, 0, maxH),
        l: skipOrLimit(skip.left, o.left, 0, maxW)
      };
    }
    function parseBorderRadius(bar, maxW, maxH) {
      const {enableBorderRadius} = bar.getProps(['enableBorderRadius']);
      const value = bar.options.borderRadius;
      const o = toTRBLCorners(value);
      const maxR = Math.min(maxW, maxH);
      const skip = bar.borderSkipped;
      const enableBorder = enableBorderRadius || isObject(value);
      return {
        topLeft: skipOrLimit(!enableBorder || skip.top || skip.left, o.topLeft, 0, maxR),
        topRight: skipOrLimit(!enableBorder || skip.top || skip.right, o.topRight, 0, maxR),
        bottomLeft: skipOrLimit(!enableBorder || skip.bottom || skip.left, o.bottomLeft, 0, maxR),
        bottomRight: skipOrLimit(!enableBorder || skip.bottom || skip.right, o.bottomRight, 0, maxR)
      };
    }
    function boundingRects(bar) {
      const bounds = getBarBounds(bar);
      const width = bounds.right - bounds.left;
      const height = bounds.bottom - bounds.top;
      const border = parseBorderWidth(bar, width / 2, height / 2);
      const radius = parseBorderRadius(bar, width / 2, height / 2);
      return {
        outer: {
          x: bounds.left,
          y: bounds.top,
          w: width,
          h: height,
          radius
        },
        inner: {
          x: bounds.left + border.l,
          y: bounds.top + border.t,
          w: width - border.l - border.r,
          h: height - border.t - border.b,
          radius: {
            topLeft: Math.max(0, radius.topLeft - Math.max(border.t, border.l)),
            topRight: Math.max(0, radius.topRight - Math.max(border.t, border.r)),
            bottomLeft: Math.max(0, radius.bottomLeft - Math.max(border.b, border.l)),
            bottomRight: Math.max(0, radius.bottomRight - Math.max(border.b, border.r)),
          }
        }
      };
    }
    function inRange(bar, x, y, useFinalPosition) {
      const skipX = x === null;
      const skipY = y === null;
      const skipBoth = skipX && skipY;
      const bounds = bar && !skipBoth && getBarBounds(bar, useFinalPosition);
      return bounds
    		&& (skipX || x >= bounds.left && x <= bounds.right)
    		&& (skipY || y >= bounds.top && y <= bounds.bottom);
    }
    function hasRadius(radius) {
      return radius.topLeft || radius.topRight || radius.bottomLeft || radius.bottomRight;
    }
    function addNormalRectPath(ctx, rect) {
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
    }
    function inflateRect(rect, amount, refRect = {}) {
      const x = rect.x !== refRect.x ? -amount : 0;
      const y = rect.y !== refRect.y ? -amount : 0;
      const w = (rect.x + rect.w !== refRect.x + refRect.w ? amount : 0) - x;
      const h = (rect.y + rect.h !== refRect.y + refRect.h ? amount : 0) - y;
      return {
        x: rect.x + x,
        y: rect.y + y,
        w: rect.w + w,
        h: rect.h + h,
        radius: rect.radius
      };
    }
    class BarElement extends Element {
      constructor(cfg) {
        super();
        this.options = undefined;
        this.horizontal = undefined;
        this.base = undefined;
        this.width = undefined;
        this.height = undefined;
        this.inflateAmount = undefined;
        if (cfg) {
          Object.assign(this, cfg);
        }
      }
      draw(ctx) {
        const {inflateAmount, options: {borderColor, backgroundColor}} = this;
        const {inner, outer} = boundingRects(this);
        const addRectPath = hasRadius(outer.radius) ? addRoundedRectPath : addNormalRectPath;
        ctx.save();
        if (outer.w !== inner.w || outer.h !== inner.h) {
          ctx.beginPath();
          addRectPath(ctx, inflateRect(outer, inflateAmount, inner));
          ctx.clip();
          addRectPath(ctx, inflateRect(inner, -inflateAmount, outer));
          ctx.fillStyle = borderColor;
          ctx.fill('evenodd');
        }
        ctx.beginPath();
        addRectPath(ctx, inflateRect(inner, inflateAmount));
        ctx.fillStyle = backgroundColor;
        ctx.fill();
        ctx.restore();
      }
      inRange(mouseX, mouseY, useFinalPosition) {
        return inRange(this, mouseX, mouseY, useFinalPosition);
      }
      inXRange(mouseX, useFinalPosition) {
        return inRange(this, mouseX, null, useFinalPosition);
      }
      inYRange(mouseY, useFinalPosition) {
        return inRange(this, null, mouseY, useFinalPosition);
      }
      getCenterPoint(useFinalPosition) {
        const {x, y, base, horizontal} = this.getProps(['x', 'y', 'base', 'horizontal'], useFinalPosition);
        return {
          x: horizontal ? (x + base) / 2 : x,
          y: horizontal ? y : (y + base) / 2
        };
      }
      getRange(axis) {
        return axis === 'x' ? this.width / 2 : this.height / 2;
      }
    }
    BarElement.id = 'bar';
    BarElement.defaults = {
      borderSkipped: 'start',
      borderWidth: 0,
      borderRadius: 0,
      inflateAmount: 'auto',
      pointStyle: undefined
    };
    BarElement.defaultRoutes = {
      backgroundColor: 'backgroundColor',
      borderColor: 'borderColor'
    };

    var elements = /*#__PURE__*/Object.freeze({
    __proto__: null,
    ArcElement: ArcElement,
    LineElement: LineElement,
    PointElement: PointElement,
    BarElement: BarElement
    });

    function lttbDecimation(data, start, count, availableWidth, options) {
      const samples = options.samples || availableWidth;
      if (samples >= count) {
        return data.slice(start, start + count);
      }
      const decimated = [];
      const bucketWidth = (count - 2) / (samples - 2);
      let sampledIndex = 0;
      const endIndex = start + count - 1;
      let a = start;
      let i, maxAreaPoint, maxArea, area, nextA;
      decimated[sampledIndex++] = data[a];
      for (i = 0; i < samples - 2; i++) {
        let avgX = 0;
        let avgY = 0;
        let j;
        const avgRangeStart = Math.floor((i + 1) * bucketWidth) + 1 + start;
        const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketWidth) + 1, count) + start;
        const avgRangeLength = avgRangeEnd - avgRangeStart;
        for (j = avgRangeStart; j < avgRangeEnd; j++) {
          avgX += data[j].x;
          avgY += data[j].y;
        }
        avgX /= avgRangeLength;
        avgY /= avgRangeLength;
        const rangeOffs = Math.floor(i * bucketWidth) + 1 + start;
        const rangeTo = Math.min(Math.floor((i + 1) * bucketWidth) + 1, count) + start;
        const {x: pointAx, y: pointAy} = data[a];
        maxArea = area = -1;
        for (j = rangeOffs; j < rangeTo; j++) {
          area = 0.5 * Math.abs(
            (pointAx - avgX) * (data[j].y - pointAy) -
            (pointAx - data[j].x) * (avgY - pointAy)
          );
          if (area > maxArea) {
            maxArea = area;
            maxAreaPoint = data[j];
            nextA = j;
          }
        }
        decimated[sampledIndex++] = maxAreaPoint;
        a = nextA;
      }
      decimated[sampledIndex++] = data[endIndex];
      return decimated;
    }
    function minMaxDecimation(data, start, count, availableWidth) {
      let avgX = 0;
      let countX = 0;
      let i, point, x, y, prevX, minIndex, maxIndex, startIndex, minY, maxY;
      const decimated = [];
      const endIndex = start + count - 1;
      const xMin = data[start].x;
      const xMax = data[endIndex].x;
      const dx = xMax - xMin;
      for (i = start; i < start + count; ++i) {
        point = data[i];
        x = (point.x - xMin) / dx * availableWidth;
        y = point.y;
        const truncX = x | 0;
        if (truncX === prevX) {
          if (y < minY) {
            minY = y;
            minIndex = i;
          } else if (y > maxY) {
            maxY = y;
            maxIndex = i;
          }
          avgX = (countX * avgX + point.x) / ++countX;
        } else {
          const lastIndex = i - 1;
          if (!isNullOrUndef(minIndex) && !isNullOrUndef(maxIndex)) {
            const intermediateIndex1 = Math.min(minIndex, maxIndex);
            const intermediateIndex2 = Math.max(minIndex, maxIndex);
            if (intermediateIndex1 !== startIndex && intermediateIndex1 !== lastIndex) {
              decimated.push({
                ...data[intermediateIndex1],
                x: avgX,
              });
            }
            if (intermediateIndex2 !== startIndex && intermediateIndex2 !== lastIndex) {
              decimated.push({
                ...data[intermediateIndex2],
                x: avgX
              });
            }
          }
          if (i > 0 && lastIndex !== startIndex) {
            decimated.push(data[lastIndex]);
          }
          decimated.push(point);
          prevX = truncX;
          countX = 0;
          minY = maxY = y;
          minIndex = maxIndex = startIndex = i;
        }
      }
      return decimated;
    }
    function cleanDecimatedDataset(dataset) {
      if (dataset._decimated) {
        const data = dataset._data;
        delete dataset._decimated;
        delete dataset._data;
        Object.defineProperty(dataset, 'data', {value: data});
      }
    }
    function cleanDecimatedData(chart) {
      chart.data.datasets.forEach((dataset) => {
        cleanDecimatedDataset(dataset);
      });
    }
    function getStartAndCountOfVisiblePointsSimplified(meta, points) {
      const pointCount = points.length;
      let start = 0;
      let count;
      const {iScale} = meta;
      const {min, max, minDefined, maxDefined} = iScale.getUserBounds();
      if (minDefined) {
        start = _limitValue(_lookupByKey(points, iScale.axis, min).lo, 0, pointCount - 1);
      }
      if (maxDefined) {
        count = _limitValue(_lookupByKey(points, iScale.axis, max).hi + 1, start, pointCount) - start;
      } else {
        count = pointCount - start;
      }
      return {start, count};
    }
    var plugin_decimation = {
      id: 'decimation',
      defaults: {
        algorithm: 'min-max',
        enabled: false,
      },
      beforeElementsUpdate: (chart, args, options) => {
        if (!options.enabled) {
          cleanDecimatedData(chart);
          return;
        }
        const availableWidth = chart.width;
        chart.data.datasets.forEach((dataset, datasetIndex) => {
          const {_data, indexAxis} = dataset;
          const meta = chart.getDatasetMeta(datasetIndex);
          const data = _data || dataset.data;
          if (resolve([indexAxis, chart.options.indexAxis]) === 'y') {
            return;
          }
          if (meta.type !== 'line') {
            return;
          }
          const xAxis = chart.scales[meta.xAxisID];
          if (xAxis.type !== 'linear' && xAxis.type !== 'time') {
            return;
          }
          if (chart.options.parsing) {
            return;
          }
          let {start, count} = getStartAndCountOfVisiblePointsSimplified(meta, data);
          const threshold = options.threshold || 4 * availableWidth;
          if (count <= threshold) {
            cleanDecimatedDataset(dataset);
            return;
          }
          if (isNullOrUndef(_data)) {
            dataset._data = data;
            delete dataset.data;
            Object.defineProperty(dataset, 'data', {
              configurable: true,
              enumerable: true,
              get: function() {
                return this._decimated;
              },
              set: function(d) {
                this._data = d;
              }
            });
          }
          let decimated;
          switch (options.algorithm) {
          case 'lttb':
            decimated = lttbDecimation(data, start, count, availableWidth, options);
            break;
          case 'min-max':
            decimated = minMaxDecimation(data, start, count, availableWidth);
            break;
          default:
            throw new Error(`Unsupported decimation algorithm '${options.algorithm}'`);
          }
          dataset._decimated = decimated;
        });
      },
      destroy(chart) {
        cleanDecimatedData(chart);
      }
    };

    function getLineByIndex(chart, index) {
      const meta = chart.getDatasetMeta(index);
      const visible = meta && chart.isDatasetVisible(index);
      return visible ? meta.dataset : null;
    }
    function parseFillOption(line) {
      const options = line.options;
      const fillOption = options.fill;
      let fill = valueOrDefault(fillOption && fillOption.target, fillOption);
      if (fill === undefined) {
        fill = !!options.backgroundColor;
      }
      if (fill === false || fill === null) {
        return false;
      }
      if (fill === true) {
        return 'origin';
      }
      return fill;
    }
    function decodeFill(line, index, count) {
      const fill = parseFillOption(line);
      if (isObject(fill)) {
        return isNaN(fill.value) ? false : fill;
      }
      let target = parseFloat(fill);
      if (isNumberFinite(target) && Math.floor(target) === target) {
        if (fill[0] === '-' || fill[0] === '+') {
          target = index + target;
        }
        if (target === index || target < 0 || target >= count) {
          return false;
        }
        return target;
      }
      return ['origin', 'start', 'end', 'stack', 'shape'].indexOf(fill) >= 0 && fill;
    }
    function computeLinearBoundary(source) {
      const {scale = {}, fill} = source;
      let target = null;
      let horizontal;
      if (fill === 'start') {
        target = scale.bottom;
      } else if (fill === 'end') {
        target = scale.top;
      } else if (isObject(fill)) {
        target = scale.getPixelForValue(fill.value);
      } else if (scale.getBasePixel) {
        target = scale.getBasePixel();
      }
      if (isNumberFinite(target)) {
        horizontal = scale.isHorizontal();
        return {
          x: horizontal ? target : null,
          y: horizontal ? null : target
        };
      }
      return null;
    }
    class simpleArc {
      constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.radius = opts.radius;
      }
      pathSegment(ctx, bounds, opts) {
        const {x, y, radius} = this;
        bounds = bounds || {start: 0, end: TAU};
        ctx.arc(x, y, radius, bounds.end, bounds.start, true);
        return !opts.bounds;
      }
      interpolate(point) {
        const {x, y, radius} = this;
        const angle = point.angle;
        return {
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius,
          angle
        };
      }
    }
    function computeCircularBoundary(source) {
      const {scale, fill} = source;
      const options = scale.options;
      const length = scale.getLabels().length;
      const target = [];
      const start = options.reverse ? scale.max : scale.min;
      const end = options.reverse ? scale.min : scale.max;
      let i, center, value;
      if (fill === 'start') {
        value = start;
      } else if (fill === 'end') {
        value = end;
      } else if (isObject(fill)) {
        value = fill.value;
      } else {
        value = scale.getBaseValue();
      }
      if (options.grid.circular) {
        center = scale.getPointPositionForValue(0, start);
        return new simpleArc({
          x: center.x,
          y: center.y,
          radius: scale.getDistanceFromCenterForValue(value)
        });
      }
      for (i = 0; i < length; ++i) {
        target.push(scale.getPointPositionForValue(i, value));
      }
      return target;
    }
    function computeBoundary(source) {
      const scale = source.scale || {};
      if (scale.getPointPositionForValue) {
        return computeCircularBoundary(source);
      }
      return computeLinearBoundary(source);
    }
    function findSegmentEnd(start, end, points) {
      for (;end > start; end--) {
        const point = points[end];
        if (!isNaN(point.x) && !isNaN(point.y)) {
          break;
        }
      }
      return end;
    }
    function pointsFromSegments(boundary, line) {
      const {x = null, y = null} = boundary || {};
      const linePoints = line.points;
      const points = [];
      line.segments.forEach(({start, end}) => {
        end = findSegmentEnd(start, end, linePoints);
        const first = linePoints[start];
        const last = linePoints[end];
        if (y !== null) {
          points.push({x: first.x, y});
          points.push({x: last.x, y});
        } else if (x !== null) {
          points.push({x, y: first.y});
          points.push({x, y: last.y});
        }
      });
      return points;
    }
    function buildStackLine(source) {
      const {scale, index, line} = source;
      const points = [];
      const segments = line.segments;
      const sourcePoints = line.points;
      const linesBelow = getLinesBelow(scale, index);
      linesBelow.push(createBoundaryLine({x: null, y: scale.bottom}, line));
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        for (let j = segment.start; j <= segment.end; j++) {
          addPointsBelow(points, sourcePoints[j], linesBelow);
        }
      }
      return new LineElement({points, options: {}});
    }
    function getLinesBelow(scale, index) {
      const below = [];
      const metas = scale.getMatchingVisibleMetas('line');
      for (let i = 0; i < metas.length; i++) {
        const meta = metas[i];
        if (meta.index === index) {
          break;
        }
        if (!meta.hidden) {
          below.unshift(meta.dataset);
        }
      }
      return below;
    }
    function addPointsBelow(points, sourcePoint, linesBelow) {
      const postponed = [];
      for (let j = 0; j < linesBelow.length; j++) {
        const line = linesBelow[j];
        const {first, last, point} = findPoint(line, sourcePoint, 'x');
        if (!point || (first && last)) {
          continue;
        }
        if (first) {
          postponed.unshift(point);
        } else {
          points.push(point);
          if (!last) {
            break;
          }
        }
      }
      points.push(...postponed);
    }
    function findPoint(line, sourcePoint, property) {
      const point = line.interpolate(sourcePoint, property);
      if (!point) {
        return {};
      }
      const pointValue = point[property];
      const segments = line.segments;
      const linePoints = line.points;
      let first = false;
      let last = false;
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const firstValue = linePoints[segment.start][property];
        const lastValue = linePoints[segment.end][property];
        if (pointValue >= firstValue && pointValue <= lastValue) {
          first = pointValue === firstValue;
          last = pointValue === lastValue;
          break;
        }
      }
      return {first, last, point};
    }
    function getTarget(source) {
      const {chart, fill, line} = source;
      if (isNumberFinite(fill)) {
        return getLineByIndex(chart, fill);
      }
      if (fill === 'stack') {
        return buildStackLine(source);
      }
      if (fill === 'shape') {
        return true;
      }
      const boundary = computeBoundary(source);
      if (boundary instanceof simpleArc) {
        return boundary;
      }
      return createBoundaryLine(boundary, line);
    }
    function createBoundaryLine(boundary, line) {
      let points = [];
      let _loop = false;
      if (isArray(boundary)) {
        _loop = true;
        points = boundary;
      } else {
        points = pointsFromSegments(boundary, line);
      }
      return points.length ? new LineElement({
        points,
        options: {tension: 0},
        _loop,
        _fullLoop: _loop
      }) : null;
    }
    function resolveTarget(sources, index, propagate) {
      const source = sources[index];
      let fill = source.fill;
      const visited = [index];
      let target;
      if (!propagate) {
        return fill;
      }
      while (fill !== false && visited.indexOf(fill) === -1) {
        if (!isNumberFinite(fill)) {
          return fill;
        }
        target = sources[fill];
        if (!target) {
          return false;
        }
        if (target.visible) {
          return fill;
        }
        visited.push(fill);
        fill = target.fill;
      }
      return false;
    }
    function _clip(ctx, target, clipY) {
      ctx.beginPath();
      target.path(ctx);
      ctx.lineTo(target.last().x, clipY);
      ctx.lineTo(target.first().x, clipY);
      ctx.closePath();
      ctx.clip();
    }
    function getBounds(property, first, last, loop) {
      if (loop) {
        return;
      }
      let start = first[property];
      let end = last[property];
      if (property === 'angle') {
        start = _normalizeAngle(start);
        end = _normalizeAngle(end);
      }
      return {property, start, end};
    }
    function _getEdge(a, b, prop, fn) {
      if (a && b) {
        return fn(a[prop], b[prop]);
      }
      return a ? a[prop] : b ? b[prop] : 0;
    }
    function _segments(line, target, property) {
      const segments = line.segments;
      const points = line.points;
      const tpoints = target.points;
      const parts = [];
      for (const segment of segments) {
        let {start, end} = segment;
        end = findSegmentEnd(start, end, points);
        const bounds = getBounds(property, points[start], points[end], segment.loop);
        if (!target.segments) {
          parts.push({
            source: segment,
            target: bounds,
            start: points[start],
            end: points[end]
          });
          continue;
        }
        const targetSegments = _boundSegments(target, bounds);
        for (const tgt of targetSegments) {
          const subBounds = getBounds(property, tpoints[tgt.start], tpoints[tgt.end], tgt.loop);
          const fillSources = _boundSegment(segment, points, subBounds);
          for (const fillSource of fillSources) {
            parts.push({
              source: fillSource,
              target: tgt,
              start: {
                [property]: _getEdge(bounds, subBounds, 'start', Math.max)
              },
              end: {
                [property]: _getEdge(bounds, subBounds, 'end', Math.min)
              }
            });
          }
        }
      }
      return parts;
    }
    function clipBounds(ctx, scale, bounds) {
      const {top, bottom} = scale.chart.chartArea;
      const {property, start, end} = bounds || {};
      if (property === 'x') {
        ctx.beginPath();
        ctx.rect(start, top, end - start, bottom - top);
        ctx.clip();
      }
    }
    function interpolatedLineTo(ctx, target, point, property) {
      const interpolatedPoint = target.interpolate(point, property);
      if (interpolatedPoint) {
        ctx.lineTo(interpolatedPoint.x, interpolatedPoint.y);
      }
    }
    function _fill(ctx, cfg) {
      const {line, target, property, color, scale} = cfg;
      const segments = _segments(line, target, property);
      for (const {source: src, target: tgt, start, end} of segments) {
        const {style: {backgroundColor = color} = {}} = src;
        const notShape = target !== true;
        ctx.save();
        ctx.fillStyle = backgroundColor;
        clipBounds(ctx, scale, notShape && getBounds(property, start, end));
        ctx.beginPath();
        const lineLoop = !!line.pathSegment(ctx, src);
        let loop;
        if (notShape) {
          if (lineLoop) {
            ctx.closePath();
          } else {
            interpolatedLineTo(ctx, target, end, property);
          }
          const targetLoop = !!target.pathSegment(ctx, tgt, {move: lineLoop, reverse: true});
          loop = lineLoop && targetLoop;
          if (!loop) {
            interpolatedLineTo(ctx, target, start, property);
          }
        }
        ctx.closePath();
        ctx.fill(loop ? 'evenodd' : 'nonzero');
        ctx.restore();
      }
    }
    function doFill(ctx, cfg) {
      const {line, target, above, below, area, scale} = cfg;
      const property = line._loop ? 'angle' : cfg.axis;
      ctx.save();
      if (property === 'x' && below !== above) {
        _clip(ctx, target, area.top);
        _fill(ctx, {line, target, color: above, scale, property});
        ctx.restore();
        ctx.save();
        _clip(ctx, target, area.bottom);
      }
      _fill(ctx, {line, target, color: below, scale, property});
      ctx.restore();
    }
    function drawfill(ctx, source, area) {
      const target = getTarget(source);
      const {line, scale, axis} = source;
      const lineOpts = line.options;
      const fillOption = lineOpts.fill;
      const color = lineOpts.backgroundColor;
      const {above = color, below = color} = fillOption || {};
      if (target && line.points.length) {
        clipArea(ctx, area);
        doFill(ctx, {line, target, above, below, area, scale, axis});
        unclipArea(ctx);
      }
    }
    var plugin_filler = {
      id: 'filler',
      afterDatasetsUpdate(chart, _args, options) {
        const count = (chart.data.datasets || []).length;
        const sources = [];
        let meta, i, line, source;
        for (i = 0; i < count; ++i) {
          meta = chart.getDatasetMeta(i);
          line = meta.dataset;
          source = null;
          if (line && line.options && line instanceof LineElement) {
            source = {
              visible: chart.isDatasetVisible(i),
              index: i,
              fill: decodeFill(line, i, count),
              chart,
              axis: meta.controller.options.indexAxis,
              scale: meta.vScale,
              line,
            };
          }
          meta.$filler = source;
          sources.push(source);
        }
        for (i = 0; i < count; ++i) {
          source = sources[i];
          if (!source || source.fill === false) {
            continue;
          }
          source.fill = resolveTarget(sources, i, options.propagate);
        }
      },
      beforeDraw(chart, _args, options) {
        const draw = options.drawTime === 'beforeDraw';
        const metasets = chart.getSortedVisibleDatasetMetas();
        const area = chart.chartArea;
        for (let i = metasets.length - 1; i >= 0; --i) {
          const source = metasets[i].$filler;
          if (!source) {
            continue;
          }
          source.line.updateControlPoints(area, source.axis);
          if (draw) {
            drawfill(chart.ctx, source, area);
          }
        }
      },
      beforeDatasetsDraw(chart, _args, options) {
        if (options.drawTime !== 'beforeDatasetsDraw') {
          return;
        }
        const metasets = chart.getSortedVisibleDatasetMetas();
        for (let i = metasets.length - 1; i >= 0; --i) {
          const source = metasets[i].$filler;
          if (source) {
            drawfill(chart.ctx, source, chart.chartArea);
          }
        }
      },
      beforeDatasetDraw(chart, args, options) {
        const source = args.meta.$filler;
        if (!source || source.fill === false || options.drawTime !== 'beforeDatasetDraw') {
          return;
        }
        drawfill(chart.ctx, source, chart.chartArea);
      },
      defaults: {
        propagate: true,
        drawTime: 'beforeDatasetDraw'
      }
    };

    const getBoxSize = (labelOpts, fontSize) => {
      let {boxHeight = fontSize, boxWidth = fontSize} = labelOpts;
      if (labelOpts.usePointStyle) {
        boxHeight = Math.min(boxHeight, fontSize);
        boxWidth = Math.min(boxWidth, fontSize);
      }
      return {
        boxWidth,
        boxHeight,
        itemHeight: Math.max(fontSize, boxHeight)
      };
    };
    const itemsEqual = (a, b) => a !== null && b !== null && a.datasetIndex === b.datasetIndex && a.index === b.index;
    class Legend extends Element {
      constructor(config) {
        super();
        this._added = false;
        this.legendHitBoxes = [];
        this._hoveredItem = null;
        this.doughnutMode = false;
        this.chart = config.chart;
        this.options = config.options;
        this.ctx = config.ctx;
        this.legendItems = undefined;
        this.columnSizes = undefined;
        this.lineWidths = undefined;
        this.maxHeight = undefined;
        this.maxWidth = undefined;
        this.top = undefined;
        this.bottom = undefined;
        this.left = undefined;
        this.right = undefined;
        this.height = undefined;
        this.width = undefined;
        this._margins = undefined;
        this.position = undefined;
        this.weight = undefined;
        this.fullSize = undefined;
      }
      update(maxWidth, maxHeight, margins) {
        this.maxWidth = maxWidth;
        this.maxHeight = maxHeight;
        this._margins = margins;
        this.setDimensions();
        this.buildLabels();
        this.fit();
      }
      setDimensions() {
        if (this.isHorizontal()) {
          this.width = this.maxWidth;
          this.left = this._margins.left;
          this.right = this.width;
        } else {
          this.height = this.maxHeight;
          this.top = this._margins.top;
          this.bottom = this.height;
        }
      }
      buildLabels() {
        const labelOpts = this.options.labels || {};
        let legendItems = callback(labelOpts.generateLabels, [this.chart], this) || [];
        if (labelOpts.filter) {
          legendItems = legendItems.filter((item) => labelOpts.filter(item, this.chart.data));
        }
        if (labelOpts.sort) {
          legendItems = legendItems.sort((a, b) => labelOpts.sort(a, b, this.chart.data));
        }
        if (this.options.reverse) {
          legendItems.reverse();
        }
        this.legendItems = legendItems;
      }
      fit() {
        const {options, ctx} = this;
        if (!options.display) {
          this.width = this.height = 0;
          return;
        }
        const labelOpts = options.labels;
        const labelFont = toFont(labelOpts.font);
        const fontSize = labelFont.size;
        const titleHeight = this._computeTitleHeight();
        const {boxWidth, itemHeight} = getBoxSize(labelOpts, fontSize);
        let width, height;
        ctx.font = labelFont.string;
        if (this.isHorizontal()) {
          width = this.maxWidth;
          height = this._fitRows(titleHeight, fontSize, boxWidth, itemHeight) + 10;
        } else {
          height = this.maxHeight;
          width = this._fitCols(titleHeight, fontSize, boxWidth, itemHeight) + 10;
        }
        this.width = Math.min(width, options.maxWidth || this.maxWidth);
        this.height = Math.min(height, options.maxHeight || this.maxHeight);
      }
      _fitRows(titleHeight, fontSize, boxWidth, itemHeight) {
        const {ctx, maxWidth, options: {labels: {padding}}} = this;
        const hitboxes = this.legendHitBoxes = [];
        const lineWidths = this.lineWidths = [0];
        const lineHeight = itemHeight + padding;
        let totalHeight = titleHeight;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        let row = -1;
        let top = -lineHeight;
        this.legendItems.forEach((legendItem, i) => {
          const itemWidth = boxWidth + (fontSize / 2) + ctx.measureText(legendItem.text).width;
          if (i === 0 || lineWidths[lineWidths.length - 1] + itemWidth + 2 * padding > maxWidth) {
            totalHeight += lineHeight;
            lineWidths[lineWidths.length - (i > 0 ? 0 : 1)] = 0;
            top += lineHeight;
            row++;
          }
          hitboxes[i] = {left: 0, top, row, width: itemWidth, height: itemHeight};
          lineWidths[lineWidths.length - 1] += itemWidth + padding;
        });
        return totalHeight;
      }
      _fitCols(titleHeight, fontSize, boxWidth, itemHeight) {
        const {ctx, maxHeight, options: {labels: {padding}}} = this;
        const hitboxes = this.legendHitBoxes = [];
        const columnSizes = this.columnSizes = [];
        const heightLimit = maxHeight - titleHeight;
        let totalWidth = padding;
        let currentColWidth = 0;
        let currentColHeight = 0;
        let left = 0;
        let col = 0;
        this.legendItems.forEach((legendItem, i) => {
          const itemWidth = boxWidth + (fontSize / 2) + ctx.measureText(legendItem.text).width;
          if (i > 0 && currentColHeight + itemHeight + 2 * padding > heightLimit) {
            totalWidth += currentColWidth + padding;
            columnSizes.push({width: currentColWidth, height: currentColHeight});
            left += currentColWidth + padding;
            col++;
            currentColWidth = currentColHeight = 0;
          }
          hitboxes[i] = {left, top: currentColHeight, col, width: itemWidth, height: itemHeight};
          currentColWidth = Math.max(currentColWidth, itemWidth);
          currentColHeight += itemHeight + padding;
        });
        totalWidth += currentColWidth;
        columnSizes.push({width: currentColWidth, height: currentColHeight});
        return totalWidth;
      }
      adjustHitBoxes() {
        if (!this.options.display) {
          return;
        }
        const titleHeight = this._computeTitleHeight();
        const {legendHitBoxes: hitboxes, options: {align, labels: {padding}, rtl}} = this;
        const rtlHelper = getRtlAdapter(rtl, this.left, this.width);
        if (this.isHorizontal()) {
          let row = 0;
          let left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
          for (const hitbox of hitboxes) {
            if (row !== hitbox.row) {
              row = hitbox.row;
              left = _alignStartEnd(align, this.left + padding, this.right - this.lineWidths[row]);
            }
            hitbox.top += this.top + titleHeight + padding;
            hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(left), hitbox.width);
            left += hitbox.width + padding;
          }
        } else {
          let col = 0;
          let top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
          for (const hitbox of hitboxes) {
            if (hitbox.col !== col) {
              col = hitbox.col;
              top = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - this.columnSizes[col].height);
            }
            hitbox.top = top;
            hitbox.left += this.left + padding;
            hitbox.left = rtlHelper.leftForLtr(rtlHelper.x(hitbox.left), hitbox.width);
            top += hitbox.height + padding;
          }
        }
      }
      isHorizontal() {
        return this.options.position === 'top' || this.options.position === 'bottom';
      }
      draw() {
        if (this.options.display) {
          const ctx = this.ctx;
          clipArea(ctx, this);
          this._draw();
          unclipArea(ctx);
        }
      }
      _draw() {
        const {options: opts, columnSizes, lineWidths, ctx} = this;
        const {align, labels: labelOpts} = opts;
        const defaultColor = defaults.color;
        const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
        const labelFont = toFont(labelOpts.font);
        const {color: fontColor, padding} = labelOpts;
        const fontSize = labelFont.size;
        const halfFontSize = fontSize / 2;
        let cursor;
        this.drawTitle();
        ctx.textAlign = rtlHelper.textAlign('left');
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 0.5;
        ctx.font = labelFont.string;
        const {boxWidth, boxHeight, itemHeight} = getBoxSize(labelOpts, fontSize);
        const drawLegendBox = function(x, y, legendItem) {
          if (isNaN(boxWidth) || boxWidth <= 0 || isNaN(boxHeight) || boxHeight < 0) {
            return;
          }
          ctx.save();
          const lineWidth = valueOrDefault(legendItem.lineWidth, 1);
          ctx.fillStyle = valueOrDefault(legendItem.fillStyle, defaultColor);
          ctx.lineCap = valueOrDefault(legendItem.lineCap, 'butt');
          ctx.lineDashOffset = valueOrDefault(legendItem.lineDashOffset, 0);
          ctx.lineJoin = valueOrDefault(legendItem.lineJoin, 'miter');
          ctx.lineWidth = lineWidth;
          ctx.strokeStyle = valueOrDefault(legendItem.strokeStyle, defaultColor);
          ctx.setLineDash(valueOrDefault(legendItem.lineDash, []));
          if (labelOpts.usePointStyle) {
            const drawOptions = {
              radius: boxWidth * Math.SQRT2 / 2,
              pointStyle: legendItem.pointStyle,
              rotation: legendItem.rotation,
              borderWidth: lineWidth
            };
            const centerX = rtlHelper.xPlus(x, boxWidth / 2);
            const centerY = y + halfFontSize;
            drawPoint(ctx, drawOptions, centerX, centerY);
          } else {
            const yBoxTop = y + Math.max((fontSize - boxHeight) / 2, 0);
            const xBoxLeft = rtlHelper.leftForLtr(x, boxWidth);
            const borderRadius = toTRBLCorners(legendItem.borderRadius);
            ctx.beginPath();
            if (Object.values(borderRadius).some(v => v !== 0)) {
              addRoundedRectPath(ctx, {
                x: xBoxLeft,
                y: yBoxTop,
                w: boxWidth,
                h: boxHeight,
                radius: borderRadius,
              });
            } else {
              ctx.rect(xBoxLeft, yBoxTop, boxWidth, boxHeight);
            }
            ctx.fill();
            if (lineWidth !== 0) {
              ctx.stroke();
            }
          }
          ctx.restore();
        };
        const fillText = function(x, y, legendItem) {
          renderText(ctx, legendItem.text, x, y + (itemHeight / 2), labelFont, {
            strikethrough: legendItem.hidden,
            textAlign: rtlHelper.textAlign(legendItem.textAlign)
          });
        };
        const isHorizontal = this.isHorizontal();
        const titleHeight = this._computeTitleHeight();
        if (isHorizontal) {
          cursor = {
            x: _alignStartEnd(align, this.left + padding, this.right - lineWidths[0]),
            y: this.top + padding + titleHeight,
            line: 0
          };
        } else {
          cursor = {
            x: this.left + padding,
            y: _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - columnSizes[0].height),
            line: 0
          };
        }
        overrideTextDirection(this.ctx, opts.textDirection);
        const lineHeight = itemHeight + padding;
        this.legendItems.forEach((legendItem, i) => {
          ctx.strokeStyle = legendItem.fontColor || fontColor;
          ctx.fillStyle = legendItem.fontColor || fontColor;
          const textWidth = ctx.measureText(legendItem.text).width;
          const textAlign = rtlHelper.textAlign(legendItem.textAlign || (legendItem.textAlign = labelOpts.textAlign));
          const width = boxWidth + halfFontSize + textWidth;
          let x = cursor.x;
          let y = cursor.y;
          rtlHelper.setWidth(this.width);
          if (isHorizontal) {
            if (i > 0 && x + width + padding > this.right) {
              y = cursor.y += lineHeight;
              cursor.line++;
              x = cursor.x = _alignStartEnd(align, this.left + padding, this.right - lineWidths[cursor.line]);
            }
          } else if (i > 0 && y + lineHeight > this.bottom) {
            x = cursor.x = x + columnSizes[cursor.line].width + padding;
            cursor.line++;
            y = cursor.y = _alignStartEnd(align, this.top + titleHeight + padding, this.bottom - columnSizes[cursor.line].height);
          }
          const realX = rtlHelper.x(x);
          drawLegendBox(realX, y, legendItem);
          x = _textX(textAlign, x + boxWidth + halfFontSize, isHorizontal ? x + width : this.right, opts.rtl);
          fillText(rtlHelper.x(x), y, legendItem);
          if (isHorizontal) {
            cursor.x += width + padding;
          } else {
            cursor.y += lineHeight;
          }
        });
        restoreTextDirection(this.ctx, opts.textDirection);
      }
      drawTitle() {
        const opts = this.options;
        const titleOpts = opts.title;
        const titleFont = toFont(titleOpts.font);
        const titlePadding = toPadding(titleOpts.padding);
        if (!titleOpts.display) {
          return;
        }
        const rtlHelper = getRtlAdapter(opts.rtl, this.left, this.width);
        const ctx = this.ctx;
        const position = titleOpts.position;
        const halfFontSize = titleFont.size / 2;
        const topPaddingPlusHalfFontSize = titlePadding.top + halfFontSize;
        let y;
        let left = this.left;
        let maxWidth = this.width;
        if (this.isHorizontal()) {
          maxWidth = Math.max(...this.lineWidths);
          y = this.top + topPaddingPlusHalfFontSize;
          left = _alignStartEnd(opts.align, left, this.right - maxWidth);
        } else {
          const maxHeight = this.columnSizes.reduce((acc, size) => Math.max(acc, size.height), 0);
          y = topPaddingPlusHalfFontSize + _alignStartEnd(opts.align, this.top, this.bottom - maxHeight - opts.labels.padding - this._computeTitleHeight());
        }
        const x = _alignStartEnd(position, left, left + maxWidth);
        ctx.textAlign = rtlHelper.textAlign(_toLeftRightCenter(position));
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = titleOpts.color;
        ctx.fillStyle = titleOpts.color;
        ctx.font = titleFont.string;
        renderText(ctx, titleOpts.text, x, y, titleFont);
      }
      _computeTitleHeight() {
        const titleOpts = this.options.title;
        const titleFont = toFont(titleOpts.font);
        const titlePadding = toPadding(titleOpts.padding);
        return titleOpts.display ? titleFont.lineHeight + titlePadding.height : 0;
      }
      _getLegendItemAt(x, y) {
        let i, hitBox, lh;
        if (x >= this.left && x <= this.right && y >= this.top && y <= this.bottom) {
          lh = this.legendHitBoxes;
          for (i = 0; i < lh.length; ++i) {
            hitBox = lh[i];
            if (x >= hitBox.left && x <= hitBox.left + hitBox.width && y >= hitBox.top && y <= hitBox.top + hitBox.height) {
              return this.legendItems[i];
            }
          }
        }
        return null;
      }
      handleEvent(e) {
        const opts = this.options;
        if (!isListened(e.type, opts)) {
          return;
        }
        const hoveredItem = this._getLegendItemAt(e.x, e.y);
        if (e.type === 'mousemove') {
          const previous = this._hoveredItem;
          const sameItem = itemsEqual(previous, hoveredItem);
          if (previous && !sameItem) {
            callback(opts.onLeave, [e, previous, this], this);
          }
          this._hoveredItem = hoveredItem;
          if (hoveredItem && !sameItem) {
            callback(opts.onHover, [e, hoveredItem, this], this);
          }
        } else if (hoveredItem) {
          callback(opts.onClick, [e, hoveredItem, this], this);
        }
      }
    }
    function isListened(type, opts) {
      if (type === 'mousemove' && (opts.onHover || opts.onLeave)) {
        return true;
      }
      if (opts.onClick && (type === 'click' || type === 'mouseup')) {
        return true;
      }
      return false;
    }
    var plugin_legend = {
      id: 'legend',
      _element: Legend,
      start(chart, _args, options) {
        const legend = chart.legend = new Legend({ctx: chart.ctx, options, chart});
        layouts.configure(chart, legend, options);
        layouts.addBox(chart, legend);
      },
      stop(chart) {
        layouts.removeBox(chart, chart.legend);
        delete chart.legend;
      },
      beforeUpdate(chart, _args, options) {
        const legend = chart.legend;
        layouts.configure(chart, legend, options);
        legend.options = options;
      },
      afterUpdate(chart) {
        const legend = chart.legend;
        legend.buildLabels();
        legend.adjustHitBoxes();
      },
      afterEvent(chart, args) {
        if (!args.replay) {
          chart.legend.handleEvent(args.event);
        }
      },
      defaults: {
        display: true,
        position: 'top',
        align: 'center',
        fullSize: true,
        reverse: false,
        weight: 1000,
        onClick(e, legendItem, legend) {
          const index = legendItem.datasetIndex;
          const ci = legend.chart;
          if (ci.isDatasetVisible(index)) {
            ci.hide(index);
            legendItem.hidden = true;
          } else {
            ci.show(index);
            legendItem.hidden = false;
          }
        },
        onHover: null,
        onLeave: null,
        labels: {
          color: (ctx) => ctx.chart.options.color,
          boxWidth: 40,
          padding: 10,
          generateLabels(chart) {
            const datasets = chart.data.datasets;
            const {labels: {usePointStyle, pointStyle, textAlign, color}} = chart.legend.options;
            return chart._getSortedDatasetMetas().map((meta) => {
              const style = meta.controller.getStyle(usePointStyle ? 0 : undefined);
              const borderWidth = toPadding(style.borderWidth);
              return {
                text: datasets[meta.index].label,
                fillStyle: style.backgroundColor,
                fontColor: color,
                hidden: !meta.visible,
                lineCap: style.borderCapStyle,
                lineDash: style.borderDash,
                lineDashOffset: style.borderDashOffset,
                lineJoin: style.borderJoinStyle,
                lineWidth: (borderWidth.width + borderWidth.height) / 4,
                strokeStyle: style.borderColor,
                pointStyle: pointStyle || style.pointStyle,
                rotation: style.rotation,
                textAlign: textAlign || style.textAlign,
                borderRadius: 0,
                datasetIndex: meta.index
              };
            }, this);
          }
        },
        title: {
          color: (ctx) => ctx.chart.options.color,
          display: false,
          position: 'center',
          text: '',
        }
      },
      descriptors: {
        _scriptable: (name) => !name.startsWith('on'),
        labels: {
          _scriptable: (name) => !['generateLabels', 'filter', 'sort'].includes(name),
        }
      },
    };

    class Title extends Element {
      constructor(config) {
        super();
        this.chart = config.chart;
        this.options = config.options;
        this.ctx = config.ctx;
        this._padding = undefined;
        this.top = undefined;
        this.bottom = undefined;
        this.left = undefined;
        this.right = undefined;
        this.width = undefined;
        this.height = undefined;
        this.position = undefined;
        this.weight = undefined;
        this.fullSize = undefined;
      }
      update(maxWidth, maxHeight) {
        const opts = this.options;
        this.left = 0;
        this.top = 0;
        if (!opts.display) {
          this.width = this.height = this.right = this.bottom = 0;
          return;
        }
        this.width = this.right = maxWidth;
        this.height = this.bottom = maxHeight;
        const lineCount = isArray(opts.text) ? opts.text.length : 1;
        this._padding = toPadding(opts.padding);
        const textSize = lineCount * toFont(opts.font).lineHeight + this._padding.height;
        if (this.isHorizontal()) {
          this.height = textSize;
        } else {
          this.width = textSize;
        }
      }
      isHorizontal() {
        const pos = this.options.position;
        return pos === 'top' || pos === 'bottom';
      }
      _drawArgs(offset) {
        const {top, left, bottom, right, options} = this;
        const align = options.align;
        let rotation = 0;
        let maxWidth, titleX, titleY;
        if (this.isHorizontal()) {
          titleX = _alignStartEnd(align, left, right);
          titleY = top + offset;
          maxWidth = right - left;
        } else {
          if (options.position === 'left') {
            titleX = left + offset;
            titleY = _alignStartEnd(align, bottom, top);
            rotation = PI * -0.5;
          } else {
            titleX = right - offset;
            titleY = _alignStartEnd(align, top, bottom);
            rotation = PI * 0.5;
          }
          maxWidth = bottom - top;
        }
        return {titleX, titleY, maxWidth, rotation};
      }
      draw() {
        const ctx = this.ctx;
        const opts = this.options;
        if (!opts.display) {
          return;
        }
        const fontOpts = toFont(opts.font);
        const lineHeight = fontOpts.lineHeight;
        const offset = lineHeight / 2 + this._padding.top;
        const {titleX, titleY, maxWidth, rotation} = this._drawArgs(offset);
        renderText(ctx, opts.text, 0, 0, fontOpts, {
          color: opts.color,
          maxWidth,
          rotation,
          textAlign: _toLeftRightCenter(opts.align),
          textBaseline: 'middle',
          translation: [titleX, titleY],
        });
      }
    }
    function createTitle(chart, titleOpts) {
      const title = new Title({
        ctx: chart.ctx,
        options: titleOpts,
        chart
      });
      layouts.configure(chart, title, titleOpts);
      layouts.addBox(chart, title);
      chart.titleBlock = title;
    }
    var plugin_title = {
      id: 'title',
      _element: Title,
      start(chart, _args, options) {
        createTitle(chart, options);
      },
      stop(chart) {
        const titleBlock = chart.titleBlock;
        layouts.removeBox(chart, titleBlock);
        delete chart.titleBlock;
      },
      beforeUpdate(chart, _args, options) {
        const title = chart.titleBlock;
        layouts.configure(chart, title, options);
        title.options = options;
      },
      defaults: {
        align: 'center',
        display: false,
        font: {
          weight: 'bold',
        },
        fullSize: true,
        padding: 10,
        position: 'top',
        text: '',
        weight: 2000
      },
      defaultRoutes: {
        color: 'color'
      },
      descriptors: {
        _scriptable: true,
        _indexable: false,
      },
    };

    const map = new WeakMap();
    var plugin_subtitle = {
      id: 'subtitle',
      start(chart, _args, options) {
        const title = new Title({
          ctx: chart.ctx,
          options,
          chart
        });
        layouts.configure(chart, title, options);
        layouts.addBox(chart, title);
        map.set(chart, title);
      },
      stop(chart) {
        layouts.removeBox(chart, map.get(chart));
        map.delete(chart);
      },
      beforeUpdate(chart, _args, options) {
        const title = map.get(chart);
        layouts.configure(chart, title, options);
        title.options = options;
      },
      defaults: {
        align: 'center',
        display: false,
        font: {
          weight: 'normal',
        },
        fullSize: true,
        padding: 0,
        position: 'top',
        text: '',
        weight: 1500
      },
      defaultRoutes: {
        color: 'color'
      },
      descriptors: {
        _scriptable: true,
        _indexable: false,
      },
    };

    const positioners = {
      average(items) {
        if (!items.length) {
          return false;
        }
        let i, len;
        let x = 0;
        let y = 0;
        let count = 0;
        for (i = 0, len = items.length; i < len; ++i) {
          const el = items[i].element;
          if (el && el.hasValue()) {
            const pos = el.tooltipPosition();
            x += pos.x;
            y += pos.y;
            ++count;
          }
        }
        return {
          x: x / count,
          y: y / count
        };
      },
      nearest(items, eventPosition) {
        if (!items.length) {
          return false;
        }
        let x = eventPosition.x;
        let y = eventPosition.y;
        let minDistance = Number.POSITIVE_INFINITY;
        let i, len, nearestElement;
        for (i = 0, len = items.length; i < len; ++i) {
          const el = items[i].element;
          if (el && el.hasValue()) {
            const center = el.getCenterPoint();
            const d = distanceBetweenPoints(eventPosition, center);
            if (d < minDistance) {
              minDistance = d;
              nearestElement = el;
            }
          }
        }
        if (nearestElement) {
          const tp = nearestElement.tooltipPosition();
          x = tp.x;
          y = tp.y;
        }
        return {
          x,
          y
        };
      }
    };
    function pushOrConcat(base, toPush) {
      if (toPush) {
        if (isArray(toPush)) {
          Array.prototype.push.apply(base, toPush);
        } else {
          base.push(toPush);
        }
      }
      return base;
    }
    function splitNewlines(str) {
      if ((typeof str === 'string' || str instanceof String) && str.indexOf('\n') > -1) {
        return str.split('\n');
      }
      return str;
    }
    function createTooltipItem(chart, item) {
      const {element, datasetIndex, index} = item;
      const controller = chart.getDatasetMeta(datasetIndex).controller;
      const {label, value} = controller.getLabelAndValue(index);
      return {
        chart,
        label,
        parsed: controller.getParsed(index),
        raw: chart.data.datasets[datasetIndex].data[index],
        formattedValue: value,
        dataset: controller.getDataset(),
        dataIndex: index,
        datasetIndex,
        element
      };
    }
    function getTooltipSize(tooltip, options) {
      const ctx = tooltip._chart.ctx;
      const {body, footer, title} = tooltip;
      const {boxWidth, boxHeight} = options;
      const bodyFont = toFont(options.bodyFont);
      const titleFont = toFont(options.titleFont);
      const footerFont = toFont(options.footerFont);
      const titleLineCount = title.length;
      const footerLineCount = footer.length;
      const bodyLineItemCount = body.length;
      const padding = toPadding(options.padding);
      let height = padding.height;
      let width = 0;
      let combinedBodyLength = body.reduce((count, bodyItem) => count + bodyItem.before.length + bodyItem.lines.length + bodyItem.after.length, 0);
      combinedBodyLength += tooltip.beforeBody.length + tooltip.afterBody.length;
      if (titleLineCount) {
        height += titleLineCount * titleFont.lineHeight
    			+ (titleLineCount - 1) * options.titleSpacing
    			+ options.titleMarginBottom;
      }
      if (combinedBodyLength) {
        const bodyLineHeight = options.displayColors ? Math.max(boxHeight, bodyFont.lineHeight) : bodyFont.lineHeight;
        height += bodyLineItemCount * bodyLineHeight
    			+ (combinedBodyLength - bodyLineItemCount) * bodyFont.lineHeight
    			+ (combinedBodyLength - 1) * options.bodySpacing;
      }
      if (footerLineCount) {
        height += options.footerMarginTop
    			+ footerLineCount * footerFont.lineHeight
    			+ (footerLineCount - 1) * options.footerSpacing;
      }
      let widthPadding = 0;
      const maxLineWidth = function(line) {
        width = Math.max(width, ctx.measureText(line).width + widthPadding);
      };
      ctx.save();
      ctx.font = titleFont.string;
      each(tooltip.title, maxLineWidth);
      ctx.font = bodyFont.string;
      each(tooltip.beforeBody.concat(tooltip.afterBody), maxLineWidth);
      widthPadding = options.displayColors ? (boxWidth + 2 + options.boxPadding) : 0;
      each(body, (bodyItem) => {
        each(bodyItem.before, maxLineWidth);
        each(bodyItem.lines, maxLineWidth);
        each(bodyItem.after, maxLineWidth);
      });
      widthPadding = 0;
      ctx.font = footerFont.string;
      each(tooltip.footer, maxLineWidth);
      ctx.restore();
      width += padding.width;
      return {width, height};
    }
    function determineYAlign(chart, size) {
      const {y, height} = size;
      if (y < height / 2) {
        return 'top';
      } else if (y > (chart.height - height / 2)) {
        return 'bottom';
      }
      return 'center';
    }
    function doesNotFitWithAlign(xAlign, chart, options, size) {
      const {x, width} = size;
      const caret = options.caretSize + options.caretPadding;
      if (xAlign === 'left' && x + width + caret > chart.width) {
        return true;
      }
      if (xAlign === 'right' && x - width - caret < 0) {
        return true;
      }
    }
    function determineXAlign(chart, options, size, yAlign) {
      const {x, width} = size;
      const {width: chartWidth, chartArea: {left, right}} = chart;
      let xAlign = 'center';
      if (yAlign === 'center') {
        xAlign = x <= (left + right) / 2 ? 'left' : 'right';
      } else if (x <= width / 2) {
        xAlign = 'left';
      } else if (x >= chartWidth - width / 2) {
        xAlign = 'right';
      }
      if (doesNotFitWithAlign(xAlign, chart, options, size)) {
        xAlign = 'center';
      }
      return xAlign;
    }
    function determineAlignment(chart, options, size) {
      const yAlign = options.yAlign || determineYAlign(chart, size);
      return {
        xAlign: options.xAlign || determineXAlign(chart, options, size, yAlign),
        yAlign
      };
    }
    function alignX(size, xAlign) {
      let {x, width} = size;
      if (xAlign === 'right') {
        x -= width;
      } else if (xAlign === 'center') {
        x -= (width / 2);
      }
      return x;
    }
    function alignY(size, yAlign, paddingAndSize) {
      let {y, height} = size;
      if (yAlign === 'top') {
        y += paddingAndSize;
      } else if (yAlign === 'bottom') {
        y -= height + paddingAndSize;
      } else {
        y -= (height / 2);
      }
      return y;
    }
    function getBackgroundPoint(options, size, alignment, chart) {
      const {caretSize, caretPadding, cornerRadius} = options;
      const {xAlign, yAlign} = alignment;
      const paddingAndSize = caretSize + caretPadding;
      const {topLeft, topRight, bottomLeft, bottomRight} = toTRBLCorners(cornerRadius);
      let x = alignX(size, xAlign);
      const y = alignY(size, yAlign, paddingAndSize);
      if (yAlign === 'center') {
        if (xAlign === 'left') {
          x += paddingAndSize;
        } else if (xAlign === 'right') {
          x -= paddingAndSize;
        }
      } else if (xAlign === 'left') {
        x -= Math.max(topLeft, bottomLeft) + caretPadding;
      } else if (xAlign === 'right') {
        x += Math.max(topRight, bottomRight) + caretPadding;
      }
      return {
        x: _limitValue(x, 0, chart.width - size.width),
        y: _limitValue(y, 0, chart.height - size.height)
      };
    }
    function getAlignedX(tooltip, align, options) {
      const padding = toPadding(options.padding);
      return align === 'center'
        ? tooltip.x + tooltip.width / 2
        : align === 'right'
          ? tooltip.x + tooltip.width - padding.right
          : tooltip.x + padding.left;
    }
    function getBeforeAfterBodyLines(callback) {
      return pushOrConcat([], splitNewlines(callback));
    }
    function createTooltipContext(parent, tooltip, tooltipItems) {
      return createContext(parent, {
        tooltip,
        tooltipItems,
        type: 'tooltip'
      });
    }
    function overrideCallbacks(callbacks, context) {
      const override = context && context.dataset && context.dataset.tooltip && context.dataset.tooltip.callbacks;
      return override ? callbacks.override(override) : callbacks;
    }
    class Tooltip extends Element {
      constructor(config) {
        super();
        this.opacity = 0;
        this._active = [];
        this._chart = config._chart;
        this._eventPosition = undefined;
        this._size = undefined;
        this._cachedAnimations = undefined;
        this._tooltipItems = [];
        this.$animations = undefined;
        this.$context = undefined;
        this.options = config.options;
        this.dataPoints = undefined;
        this.title = undefined;
        this.beforeBody = undefined;
        this.body = undefined;
        this.afterBody = undefined;
        this.footer = undefined;
        this.xAlign = undefined;
        this.yAlign = undefined;
        this.x = undefined;
        this.y = undefined;
        this.height = undefined;
        this.width = undefined;
        this.caretX = undefined;
        this.caretY = undefined;
        this.labelColors = undefined;
        this.labelPointStyles = undefined;
        this.labelTextColors = undefined;
      }
      initialize(options) {
        this.options = options;
        this._cachedAnimations = undefined;
        this.$context = undefined;
      }
      _resolveAnimations() {
        const cached = this._cachedAnimations;
        if (cached) {
          return cached;
        }
        const chart = this._chart;
        const options = this.options.setContext(this.getContext());
        const opts = options.enabled && chart.options.animation && options.animations;
        const animations = new Animations(this._chart, opts);
        if (opts._cacheable) {
          this._cachedAnimations = Object.freeze(animations);
        }
        return animations;
      }
      getContext() {
        return this.$context ||
    			(this.$context = createTooltipContext(this._chart.getContext(), this, this._tooltipItems));
      }
      getTitle(context, options) {
        const {callbacks} = options;
        const beforeTitle = callbacks.beforeTitle.apply(this, [context]);
        const title = callbacks.title.apply(this, [context]);
        const afterTitle = callbacks.afterTitle.apply(this, [context]);
        let lines = [];
        lines = pushOrConcat(lines, splitNewlines(beforeTitle));
        lines = pushOrConcat(lines, splitNewlines(title));
        lines = pushOrConcat(lines, splitNewlines(afterTitle));
        return lines;
      }
      getBeforeBody(tooltipItems, options) {
        return getBeforeAfterBodyLines(options.callbacks.beforeBody.apply(this, [tooltipItems]));
      }
      getBody(tooltipItems, options) {
        const {callbacks} = options;
        const bodyItems = [];
        each(tooltipItems, (context) => {
          const bodyItem = {
            before: [],
            lines: [],
            after: []
          };
          const scoped = overrideCallbacks(callbacks, context);
          pushOrConcat(bodyItem.before, splitNewlines(scoped.beforeLabel.call(this, context)));
          pushOrConcat(bodyItem.lines, scoped.label.call(this, context));
          pushOrConcat(bodyItem.after, splitNewlines(scoped.afterLabel.call(this, context)));
          bodyItems.push(bodyItem);
        });
        return bodyItems;
      }
      getAfterBody(tooltipItems, options) {
        return getBeforeAfterBodyLines(options.callbacks.afterBody.apply(this, [tooltipItems]));
      }
      getFooter(tooltipItems, options) {
        const {callbacks} = options;
        const beforeFooter = callbacks.beforeFooter.apply(this, [tooltipItems]);
        const footer = callbacks.footer.apply(this, [tooltipItems]);
        const afterFooter = callbacks.afterFooter.apply(this, [tooltipItems]);
        let lines = [];
        lines = pushOrConcat(lines, splitNewlines(beforeFooter));
        lines = pushOrConcat(lines, splitNewlines(footer));
        lines = pushOrConcat(lines, splitNewlines(afterFooter));
        return lines;
      }
      _createItems(options) {
        const active = this._active;
        const data = this._chart.data;
        const labelColors = [];
        const labelPointStyles = [];
        const labelTextColors = [];
        let tooltipItems = [];
        let i, len;
        for (i = 0, len = active.length; i < len; ++i) {
          tooltipItems.push(createTooltipItem(this._chart, active[i]));
        }
        if (options.filter) {
          tooltipItems = tooltipItems.filter((element, index, array) => options.filter(element, index, array, data));
        }
        if (options.itemSort) {
          tooltipItems = tooltipItems.sort((a, b) => options.itemSort(a, b, data));
        }
        each(tooltipItems, (context) => {
          const scoped = overrideCallbacks(options.callbacks, context);
          labelColors.push(scoped.labelColor.call(this, context));
          labelPointStyles.push(scoped.labelPointStyle.call(this, context));
          labelTextColors.push(scoped.labelTextColor.call(this, context));
        });
        this.labelColors = labelColors;
        this.labelPointStyles = labelPointStyles;
        this.labelTextColors = labelTextColors;
        this.dataPoints = tooltipItems;
        return tooltipItems;
      }
      update(changed, replay) {
        const options = this.options.setContext(this.getContext());
        const active = this._active;
        let properties;
        let tooltipItems = [];
        if (!active.length) {
          if (this.opacity !== 0) {
            properties = {
              opacity: 0
            };
          }
        } else {
          const position = positioners[options.position].call(this, active, this._eventPosition);
          tooltipItems = this._createItems(options);
          this.title = this.getTitle(tooltipItems, options);
          this.beforeBody = this.getBeforeBody(tooltipItems, options);
          this.body = this.getBody(tooltipItems, options);
          this.afterBody = this.getAfterBody(tooltipItems, options);
          this.footer = this.getFooter(tooltipItems, options);
          const size = this._size = getTooltipSize(this, options);
          const positionAndSize = Object.assign({}, position, size);
          const alignment = determineAlignment(this._chart, options, positionAndSize);
          const backgroundPoint = getBackgroundPoint(options, positionAndSize, alignment, this._chart);
          this.xAlign = alignment.xAlign;
          this.yAlign = alignment.yAlign;
          properties = {
            opacity: 1,
            x: backgroundPoint.x,
            y: backgroundPoint.y,
            width: size.width,
            height: size.height,
            caretX: position.x,
            caretY: position.y
          };
        }
        this._tooltipItems = tooltipItems;
        this.$context = undefined;
        if (properties) {
          this._resolveAnimations().update(this, properties);
        }
        if (changed && options.external) {
          options.external.call(this, {chart: this._chart, tooltip: this, replay});
        }
      }
      drawCaret(tooltipPoint, ctx, size, options) {
        const caretPosition = this.getCaretPosition(tooltipPoint, size, options);
        ctx.lineTo(caretPosition.x1, caretPosition.y1);
        ctx.lineTo(caretPosition.x2, caretPosition.y2);
        ctx.lineTo(caretPosition.x3, caretPosition.y3);
      }
      getCaretPosition(tooltipPoint, size, options) {
        const {xAlign, yAlign} = this;
        const {caretSize, cornerRadius} = options;
        const {topLeft, topRight, bottomLeft, bottomRight} = toTRBLCorners(cornerRadius);
        const {x: ptX, y: ptY} = tooltipPoint;
        const {width, height} = size;
        let x1, x2, x3, y1, y2, y3;
        if (yAlign === 'center') {
          y2 = ptY + (height / 2);
          if (xAlign === 'left') {
            x1 = ptX;
            x2 = x1 - caretSize;
            y1 = y2 + caretSize;
            y3 = y2 - caretSize;
          } else {
            x1 = ptX + width;
            x2 = x1 + caretSize;
            y1 = y2 - caretSize;
            y3 = y2 + caretSize;
          }
          x3 = x1;
        } else {
          if (xAlign === 'left') {
            x2 = ptX + Math.max(topLeft, bottomLeft) + (caretSize);
          } else if (xAlign === 'right') {
            x2 = ptX + width - Math.max(topRight, bottomRight) - caretSize;
          } else {
            x2 = this.caretX;
          }
          if (yAlign === 'top') {
            y1 = ptY;
            y2 = y1 - caretSize;
            x1 = x2 - caretSize;
            x3 = x2 + caretSize;
          } else {
            y1 = ptY + height;
            y2 = y1 + caretSize;
            x1 = x2 + caretSize;
            x3 = x2 - caretSize;
          }
          y3 = y1;
        }
        return {x1, x2, x3, y1, y2, y3};
      }
      drawTitle(pt, ctx, options) {
        const title = this.title;
        const length = title.length;
        let titleFont, titleSpacing, i;
        if (length) {
          const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
          pt.x = getAlignedX(this, options.titleAlign, options);
          ctx.textAlign = rtlHelper.textAlign(options.titleAlign);
          ctx.textBaseline = 'middle';
          titleFont = toFont(options.titleFont);
          titleSpacing = options.titleSpacing;
          ctx.fillStyle = options.titleColor;
          ctx.font = titleFont.string;
          for (i = 0; i < length; ++i) {
            ctx.fillText(title[i], rtlHelper.x(pt.x), pt.y + titleFont.lineHeight / 2);
            pt.y += titleFont.lineHeight + titleSpacing;
            if (i + 1 === length) {
              pt.y += options.titleMarginBottom - titleSpacing;
            }
          }
        }
      }
      _drawColorBox(ctx, pt, i, rtlHelper, options) {
        const labelColors = this.labelColors[i];
        const labelPointStyle = this.labelPointStyles[i];
        const {boxHeight, boxWidth, boxPadding} = options;
        const bodyFont = toFont(options.bodyFont);
        const colorX = getAlignedX(this, 'left', options);
        const rtlColorX = rtlHelper.x(colorX);
        const yOffSet = boxHeight < bodyFont.lineHeight ? (bodyFont.lineHeight - boxHeight) / 2 : 0;
        const colorY = pt.y + yOffSet;
        if (options.usePointStyle) {
          const drawOptions = {
            radius: Math.min(boxWidth, boxHeight) / 2,
            pointStyle: labelPointStyle.pointStyle,
            rotation: labelPointStyle.rotation,
            borderWidth: 1
          };
          const centerX = rtlHelper.leftForLtr(rtlColorX, boxWidth) + boxWidth / 2;
          const centerY = colorY + boxHeight / 2;
          ctx.strokeStyle = options.multiKeyBackground;
          ctx.fillStyle = options.multiKeyBackground;
          drawPoint(ctx, drawOptions, centerX, centerY);
          ctx.strokeStyle = labelColors.borderColor;
          ctx.fillStyle = labelColors.backgroundColor;
          drawPoint(ctx, drawOptions, centerX, centerY);
        } else {
          ctx.lineWidth = labelColors.borderWidth || 1;
          ctx.strokeStyle = labelColors.borderColor;
          ctx.setLineDash(labelColors.borderDash || []);
          ctx.lineDashOffset = labelColors.borderDashOffset || 0;
          const outerX = rtlHelper.leftForLtr(rtlColorX, boxWidth - boxPadding);
          const innerX = rtlHelper.leftForLtr(rtlHelper.xPlus(rtlColorX, 1), boxWidth - boxPadding - 2);
          const borderRadius = toTRBLCorners(labelColors.borderRadius);
          if (Object.values(borderRadius).some(v => v !== 0)) {
            ctx.beginPath();
            ctx.fillStyle = options.multiKeyBackground;
            addRoundedRectPath(ctx, {
              x: outerX,
              y: colorY,
              w: boxWidth,
              h: boxHeight,
              radius: borderRadius,
            });
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = labelColors.backgroundColor;
            ctx.beginPath();
            addRoundedRectPath(ctx, {
              x: innerX,
              y: colorY + 1,
              w: boxWidth - 2,
              h: boxHeight - 2,
              radius: borderRadius,
            });
            ctx.fill();
          } else {
            ctx.fillStyle = options.multiKeyBackground;
            ctx.fillRect(outerX, colorY, boxWidth, boxHeight);
            ctx.strokeRect(outerX, colorY, boxWidth, boxHeight);
            ctx.fillStyle = labelColors.backgroundColor;
            ctx.fillRect(innerX, colorY + 1, boxWidth - 2, boxHeight - 2);
          }
        }
        ctx.fillStyle = this.labelTextColors[i];
      }
      drawBody(pt, ctx, options) {
        const {body} = this;
        const {bodySpacing, bodyAlign, displayColors, boxHeight, boxWidth, boxPadding} = options;
        const bodyFont = toFont(options.bodyFont);
        let bodyLineHeight = bodyFont.lineHeight;
        let xLinePadding = 0;
        const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
        const fillLineOfText = function(line) {
          ctx.fillText(line, rtlHelper.x(pt.x + xLinePadding), pt.y + bodyLineHeight / 2);
          pt.y += bodyLineHeight + bodySpacing;
        };
        const bodyAlignForCalculation = rtlHelper.textAlign(bodyAlign);
        let bodyItem, textColor, lines, i, j, ilen, jlen;
        ctx.textAlign = bodyAlign;
        ctx.textBaseline = 'middle';
        ctx.font = bodyFont.string;
        pt.x = getAlignedX(this, bodyAlignForCalculation, options);
        ctx.fillStyle = options.bodyColor;
        each(this.beforeBody, fillLineOfText);
        xLinePadding = displayColors && bodyAlignForCalculation !== 'right'
          ? bodyAlign === 'center' ? (boxWidth / 2 + boxPadding) : (boxWidth + 2 + boxPadding)
          : 0;
        for (i = 0, ilen = body.length; i < ilen; ++i) {
          bodyItem = body[i];
          textColor = this.labelTextColors[i];
          ctx.fillStyle = textColor;
          each(bodyItem.before, fillLineOfText);
          lines = bodyItem.lines;
          if (displayColors && lines.length) {
            this._drawColorBox(ctx, pt, i, rtlHelper, options);
            bodyLineHeight = Math.max(bodyFont.lineHeight, boxHeight);
          }
          for (j = 0, jlen = lines.length; j < jlen; ++j) {
            fillLineOfText(lines[j]);
            bodyLineHeight = bodyFont.lineHeight;
          }
          each(bodyItem.after, fillLineOfText);
        }
        xLinePadding = 0;
        bodyLineHeight = bodyFont.lineHeight;
        each(this.afterBody, fillLineOfText);
        pt.y -= bodySpacing;
      }
      drawFooter(pt, ctx, options) {
        const footer = this.footer;
        const length = footer.length;
        let footerFont, i;
        if (length) {
          const rtlHelper = getRtlAdapter(options.rtl, this.x, this.width);
          pt.x = getAlignedX(this, options.footerAlign, options);
          pt.y += options.footerMarginTop;
          ctx.textAlign = rtlHelper.textAlign(options.footerAlign);
          ctx.textBaseline = 'middle';
          footerFont = toFont(options.footerFont);
          ctx.fillStyle = options.footerColor;
          ctx.font = footerFont.string;
          for (i = 0; i < length; ++i) {
            ctx.fillText(footer[i], rtlHelper.x(pt.x), pt.y + footerFont.lineHeight / 2);
            pt.y += footerFont.lineHeight + options.footerSpacing;
          }
        }
      }
      drawBackground(pt, ctx, tooltipSize, options) {
        const {xAlign, yAlign} = this;
        const {x, y} = pt;
        const {width, height} = tooltipSize;
        const {topLeft, topRight, bottomLeft, bottomRight} = toTRBLCorners(options.cornerRadius);
        ctx.fillStyle = options.backgroundColor;
        ctx.strokeStyle = options.borderColor;
        ctx.lineWidth = options.borderWidth;
        ctx.beginPath();
        ctx.moveTo(x + topLeft, y);
        if (yAlign === 'top') {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + width - topRight, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + topRight);
        if (yAlign === 'center' && xAlign === 'right') {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + width, y + height - bottomRight);
        ctx.quadraticCurveTo(x + width, y + height, x + width - bottomRight, y + height);
        if (yAlign === 'bottom') {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x + bottomLeft, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - bottomLeft);
        if (yAlign === 'center' && xAlign === 'left') {
          this.drawCaret(pt, ctx, tooltipSize, options);
        }
        ctx.lineTo(x, y + topLeft);
        ctx.quadraticCurveTo(x, y, x + topLeft, y);
        ctx.closePath();
        ctx.fill();
        if (options.borderWidth > 0) {
          ctx.stroke();
        }
      }
      _updateAnimationTarget(options) {
        const chart = this._chart;
        const anims = this.$animations;
        const animX = anims && anims.x;
        const animY = anims && anims.y;
        if (animX || animY) {
          const position = positioners[options.position].call(this, this._active, this._eventPosition);
          if (!position) {
            return;
          }
          const size = this._size = getTooltipSize(this, options);
          const positionAndSize = Object.assign({}, position, this._size);
          const alignment = determineAlignment(chart, options, positionAndSize);
          const point = getBackgroundPoint(options, positionAndSize, alignment, chart);
          if (animX._to !== point.x || animY._to !== point.y) {
            this.xAlign = alignment.xAlign;
            this.yAlign = alignment.yAlign;
            this.width = size.width;
            this.height = size.height;
            this.caretX = position.x;
            this.caretY = position.y;
            this._resolveAnimations().update(this, point);
          }
        }
      }
      draw(ctx) {
        const options = this.options.setContext(this.getContext());
        let opacity = this.opacity;
        if (!opacity) {
          return;
        }
        this._updateAnimationTarget(options);
        const tooltipSize = {
          width: this.width,
          height: this.height
        };
        const pt = {
          x: this.x,
          y: this.y
        };
        opacity = Math.abs(opacity) < 1e-3 ? 0 : opacity;
        const padding = toPadding(options.padding);
        const hasTooltipContent = this.title.length || this.beforeBody.length || this.body.length || this.afterBody.length || this.footer.length;
        if (options.enabled && hasTooltipContent) {
          ctx.save();
          ctx.globalAlpha = opacity;
          this.drawBackground(pt, ctx, tooltipSize, options);
          overrideTextDirection(ctx, options.textDirection);
          pt.y += padding.top;
          this.drawTitle(pt, ctx, options);
          this.drawBody(pt, ctx, options);
          this.drawFooter(pt, ctx, options);
          restoreTextDirection(ctx, options.textDirection);
          ctx.restore();
        }
      }
      getActiveElements() {
        return this._active || [];
      }
      setActiveElements(activeElements, eventPosition) {
        const lastActive = this._active;
        const active = activeElements.map(({datasetIndex, index}) => {
          const meta = this._chart.getDatasetMeta(datasetIndex);
          if (!meta) {
            throw new Error('Cannot find a dataset at index ' + datasetIndex);
          }
          return {
            datasetIndex,
            element: meta.data[index],
            index,
          };
        });
        const changed = !_elementsEqual(lastActive, active);
        const positionChanged = this._positionChanged(active, eventPosition);
        if (changed || positionChanged) {
          this._active = active;
          this._eventPosition = eventPosition;
          this.update(true);
        }
      }
      handleEvent(e, replay) {
        const options = this.options;
        const lastActive = this._active || [];
        let changed = false;
        let active = [];
        if (e.type !== 'mouseout') {
          active = this._chart.getElementsAtEventForMode(e, options.mode, options, replay);
          if (options.reverse) {
            active.reverse();
          }
        }
        const positionChanged = this._positionChanged(active, e);
        changed = replay || !_elementsEqual(active, lastActive) || positionChanged;
        if (changed) {
          this._active = active;
          if (options.enabled || options.external) {
            this._eventPosition = {
              x: e.x,
              y: e.y
            };
            this.update(true, replay);
          }
        }
        return changed;
      }
      _positionChanged(active, e) {
        const {caretX, caretY, options} = this;
        const position = positioners[options.position].call(this, active, e);
        return position !== false && (caretX !== position.x || caretY !== position.y);
      }
    }
    Tooltip.positioners = positioners;
    var plugin_tooltip = {
      id: 'tooltip',
      _element: Tooltip,
      positioners,
      afterInit(chart, _args, options) {
        if (options) {
          chart.tooltip = new Tooltip({_chart: chart, options});
        }
      },
      beforeUpdate(chart, _args, options) {
        if (chart.tooltip) {
          chart.tooltip.initialize(options);
        }
      },
      reset(chart, _args, options) {
        if (chart.tooltip) {
          chart.tooltip.initialize(options);
        }
      },
      afterDraw(chart) {
        const tooltip = chart.tooltip;
        const args = {
          tooltip
        };
        if (chart.notifyPlugins('beforeTooltipDraw', args) === false) {
          return;
        }
        if (tooltip) {
          tooltip.draw(chart.ctx);
        }
        chart.notifyPlugins('afterTooltipDraw', args);
      },
      afterEvent(chart, args) {
        if (chart.tooltip) {
          const useFinalPosition = args.replay;
          if (chart.tooltip.handleEvent(args.event, useFinalPosition)) {
            args.changed = true;
          }
        }
      },
      defaults: {
        enabled: true,
        external: null,
        position: 'average',
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        titleFont: {
          weight: 'bold',
        },
        titleSpacing: 2,
        titleMarginBottom: 6,
        titleAlign: 'left',
        bodyColor: '#fff',
        bodySpacing: 2,
        bodyFont: {
        },
        bodyAlign: 'left',
        footerColor: '#fff',
        footerSpacing: 2,
        footerMarginTop: 6,
        footerFont: {
          weight: 'bold',
        },
        footerAlign: 'left',
        padding: 6,
        caretPadding: 2,
        caretSize: 5,
        cornerRadius: 6,
        boxHeight: (ctx, opts) => opts.bodyFont.size,
        boxWidth: (ctx, opts) => opts.bodyFont.size,
        multiKeyBackground: '#fff',
        displayColors: true,
        boxPadding: 0,
        borderColor: 'rgba(0,0,0,0)',
        borderWidth: 0,
        animation: {
          duration: 400,
          easing: 'easeOutQuart',
        },
        animations: {
          numbers: {
            type: 'number',
            properties: ['x', 'y', 'width', 'height', 'caretX', 'caretY'],
          },
          opacity: {
            easing: 'linear',
            duration: 200
          }
        },
        callbacks: {
          beforeTitle: noop,
          title(tooltipItems) {
            if (tooltipItems.length > 0) {
              const item = tooltipItems[0];
              const labels = item.chart.data.labels;
              const labelCount = labels ? labels.length : 0;
              if (this && this.options && this.options.mode === 'dataset') {
                return item.dataset.label || '';
              } else if (item.label) {
                return item.label;
              } else if (labelCount > 0 && item.dataIndex < labelCount) {
                return labels[item.dataIndex];
              }
            }
            return '';
          },
          afterTitle: noop,
          beforeBody: noop,
          beforeLabel: noop,
          label(tooltipItem) {
            if (this && this.options && this.options.mode === 'dataset') {
              return tooltipItem.label + ': ' + tooltipItem.formattedValue || tooltipItem.formattedValue;
            }
            let label = tooltipItem.dataset.label || '';
            if (label) {
              label += ': ';
            }
            const value = tooltipItem.formattedValue;
            if (!isNullOrUndef(value)) {
              label += value;
            }
            return label;
          },
          labelColor(tooltipItem) {
            const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
            const options = meta.controller.getStyle(tooltipItem.dataIndex);
            return {
              borderColor: options.borderColor,
              backgroundColor: options.backgroundColor,
              borderWidth: options.borderWidth,
              borderDash: options.borderDash,
              borderDashOffset: options.borderDashOffset,
              borderRadius: 0,
            };
          },
          labelTextColor() {
            return this.options.bodyColor;
          },
          labelPointStyle(tooltipItem) {
            const meta = tooltipItem.chart.getDatasetMeta(tooltipItem.datasetIndex);
            const options = meta.controller.getStyle(tooltipItem.dataIndex);
            return {
              pointStyle: options.pointStyle,
              rotation: options.rotation,
            };
          },
          afterLabel: noop,
          afterBody: noop,
          beforeFooter: noop,
          footer: noop,
          afterFooter: noop
        }
      },
      defaultRoutes: {
        bodyFont: 'font',
        footerFont: 'font',
        titleFont: 'font'
      },
      descriptors: {
        _scriptable: (name) => name !== 'filter' && name !== 'itemSort' && name !== 'external',
        _indexable: false,
        callbacks: {
          _scriptable: false,
          _indexable: false,
        },
        animation: {
          _fallback: false
        },
        animations: {
          _fallback: 'animation'
        }
      },
      additionalOptionScopes: ['interaction']
    };

    var plugins = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Decimation: plugin_decimation,
    Filler: plugin_filler,
    Legend: plugin_legend,
    SubTitle: plugin_subtitle,
    Title: plugin_title,
    Tooltip: plugin_tooltip
    });

    const addIfString = (labels, raw, index) => typeof raw === 'string'
      ? labels.push(raw) - 1
      : isNaN(raw) ? null : index;
    function findOrAddLabel(labels, raw, index) {
      const first = labels.indexOf(raw);
      if (first === -1) {
        return addIfString(labels, raw, index);
      }
      const last = labels.lastIndexOf(raw);
      return first !== last ? index : first;
    }
    const validIndex = (index, max) => index === null ? null : _limitValue(Math.round(index), 0, max);
    class CategoryScale extends Scale {
      constructor(cfg) {
        super(cfg);
        this._startValue = undefined;
        this._valueRange = 0;
      }
      parse(raw, index) {
        if (isNullOrUndef(raw)) {
          return null;
        }
        const labels = this.getLabels();
        index = isFinite(index) && labels[index] === raw ? index
          : findOrAddLabel(labels, raw, valueOrDefault(index, raw));
        return validIndex(index, labels.length - 1);
      }
      determineDataLimits() {
        const {minDefined, maxDefined} = this.getUserBounds();
        let {min, max} = this.getMinMax(true);
        if (this.options.bounds === 'ticks') {
          if (!minDefined) {
            min = 0;
          }
          if (!maxDefined) {
            max = this.getLabels().length - 1;
          }
        }
        this.min = min;
        this.max = max;
      }
      buildTicks() {
        const min = this.min;
        const max = this.max;
        const offset = this.options.offset;
        const ticks = [];
        let labels = this.getLabels();
        labels = (min === 0 && max === labels.length - 1) ? labels : labels.slice(min, max + 1);
        this._valueRange = Math.max(labels.length - (offset ? 0 : 1), 1);
        this._startValue = this.min - (offset ? 0.5 : 0);
        for (let value = min; value <= max; value++) {
          ticks.push({value});
        }
        return ticks;
      }
      getLabelForValue(value) {
        const labels = this.getLabels();
        if (value >= 0 && value < labels.length) {
          return labels[value];
        }
        return value;
      }
      configure() {
        super.configure();
        if (!this.isHorizontal()) {
          this._reversePixels = !this._reversePixels;
        }
      }
      getPixelForValue(value) {
        if (typeof value !== 'number') {
          value = this.parse(value);
        }
        return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
      }
      getPixelForTick(index) {
        const ticks = this.ticks;
        if (index < 0 || index > ticks.length - 1) {
          return null;
        }
        return this.getPixelForValue(ticks[index].value);
      }
      getValueForPixel(pixel) {
        return Math.round(this._startValue + this.getDecimalForPixel(pixel) * this._valueRange);
      }
      getBasePixel() {
        return this.bottom;
      }
    }
    CategoryScale.id = 'category';
    CategoryScale.defaults = {
      ticks: {
        callback: CategoryScale.prototype.getLabelForValue
      }
    };

    function generateTicks$1(generationOptions, dataRange) {
      const ticks = [];
      const MIN_SPACING = 1e-14;
      const {bounds, step, min, max, precision, count, maxTicks, maxDigits, includeBounds} = generationOptions;
      const unit = step || 1;
      const maxSpaces = maxTicks - 1;
      const {min: rmin, max: rmax} = dataRange;
      const minDefined = !isNullOrUndef(min);
      const maxDefined = !isNullOrUndef(max);
      const countDefined = !isNullOrUndef(count);
      const minSpacing = (rmax - rmin) / (maxDigits + 1);
      let spacing = niceNum((rmax - rmin) / maxSpaces / unit) * unit;
      let factor, niceMin, niceMax, numSpaces;
      if (spacing < MIN_SPACING && !minDefined && !maxDefined) {
        return [{value: rmin}, {value: rmax}];
      }
      numSpaces = Math.ceil(rmax / spacing) - Math.floor(rmin / spacing);
      if (numSpaces > maxSpaces) {
        spacing = niceNum(numSpaces * spacing / maxSpaces / unit) * unit;
      }
      if (!isNullOrUndef(precision)) {
        factor = Math.pow(10, precision);
        spacing = Math.ceil(spacing * factor) / factor;
      }
      if (bounds === 'ticks') {
        niceMin = Math.floor(rmin / spacing) * spacing;
        niceMax = Math.ceil(rmax / spacing) * spacing;
      } else {
        niceMin = rmin;
        niceMax = rmax;
      }
      if (minDefined && maxDefined && step && almostWhole((max - min) / step, spacing / 1000)) {
        numSpaces = Math.round(Math.min((max - min) / spacing, maxTicks));
        spacing = (max - min) / numSpaces;
        niceMin = min;
        niceMax = max;
      } else if (countDefined) {
        niceMin = minDefined ? min : niceMin;
        niceMax = maxDefined ? max : niceMax;
        numSpaces = count - 1;
        spacing = (niceMax - niceMin) / numSpaces;
      } else {
        numSpaces = (niceMax - niceMin) / spacing;
        if (almostEquals(numSpaces, Math.round(numSpaces), spacing / 1000)) {
          numSpaces = Math.round(numSpaces);
        } else {
          numSpaces = Math.ceil(numSpaces);
        }
      }
      const decimalPlaces = Math.max(
        _decimalPlaces(spacing),
        _decimalPlaces(niceMin)
      );
      factor = Math.pow(10, isNullOrUndef(precision) ? decimalPlaces : precision);
      niceMin = Math.round(niceMin * factor) / factor;
      niceMax = Math.round(niceMax * factor) / factor;
      let j = 0;
      if (minDefined) {
        if (includeBounds && niceMin !== min) {
          ticks.push({value: min});
          if (niceMin < min) {
            j++;
          }
          if (almostEquals(Math.round((niceMin + j * spacing) * factor) / factor, min, relativeLabelSize(min, minSpacing, generationOptions))) {
            j++;
          }
        } else if (niceMin < min) {
          j++;
        }
      }
      for (; j < numSpaces; ++j) {
        ticks.push({value: Math.round((niceMin + j * spacing) * factor) / factor});
      }
      if (maxDefined && includeBounds && niceMax !== max) {
        if (ticks.length && almostEquals(ticks[ticks.length - 1].value, max, relativeLabelSize(max, minSpacing, generationOptions))) {
          ticks[ticks.length - 1].value = max;
        } else {
          ticks.push({value: max});
        }
      } else if (!maxDefined || niceMax === max) {
        ticks.push({value: niceMax});
      }
      return ticks;
    }
    function relativeLabelSize(value, minSpacing, {horizontal, minRotation}) {
      const rad = toRadians(minRotation);
      const ratio = (horizontal ? Math.sin(rad) : Math.cos(rad)) || 0.001;
      const length = 0.75 * minSpacing * ('' + value).length;
      return Math.min(minSpacing / ratio, length);
    }
    class LinearScaleBase extends Scale {
      constructor(cfg) {
        super(cfg);
        this.start = undefined;
        this.end = undefined;
        this._startValue = undefined;
        this._endValue = undefined;
        this._valueRange = 0;
      }
      parse(raw, index) {
        if (isNullOrUndef(raw)) {
          return null;
        }
        if ((typeof raw === 'number' || raw instanceof Number) && !isFinite(+raw)) {
          return null;
        }
        return +raw;
      }
      handleTickRangeOptions() {
        const {beginAtZero} = this.options;
        const {minDefined, maxDefined} = this.getUserBounds();
        let {min, max} = this;
        const setMin = v => (min = minDefined ? min : v);
        const setMax = v => (max = maxDefined ? max : v);
        if (beginAtZero) {
          const minSign = sign(min);
          const maxSign = sign(max);
          if (minSign < 0 && maxSign < 0) {
            setMax(0);
          } else if (minSign > 0 && maxSign > 0) {
            setMin(0);
          }
        }
        if (min === max) {
          let offset = 1;
          if (max >= Number.MAX_SAFE_INTEGER || min <= Number.MIN_SAFE_INTEGER) {
            offset = Math.abs(max * 0.05);
          }
          setMax(max + offset);
          if (!beginAtZero) {
            setMin(min - offset);
          }
        }
        this.min = min;
        this.max = max;
      }
      getTickLimit() {
        const tickOpts = this.options.ticks;
        let {maxTicksLimit, stepSize} = tickOpts;
        let maxTicks;
        if (stepSize) {
          maxTicks = Math.ceil(this.max / stepSize) - Math.floor(this.min / stepSize) + 1;
          if (maxTicks > 1000) {
            console.warn(`scales.${this.id}.ticks.stepSize: ${stepSize} would result generating up to ${maxTicks} ticks. Limiting to 1000.`);
            maxTicks = 1000;
          }
        } else {
          maxTicks = this.computeTickLimit();
          maxTicksLimit = maxTicksLimit || 11;
        }
        if (maxTicksLimit) {
          maxTicks = Math.min(maxTicksLimit, maxTicks);
        }
        return maxTicks;
      }
      computeTickLimit() {
        return Number.POSITIVE_INFINITY;
      }
      buildTicks() {
        const opts = this.options;
        const tickOpts = opts.ticks;
        let maxTicks = this.getTickLimit();
        maxTicks = Math.max(2, maxTicks);
        const numericGeneratorOptions = {
          maxTicks,
          bounds: opts.bounds,
          min: opts.min,
          max: opts.max,
          precision: tickOpts.precision,
          step: tickOpts.stepSize,
          count: tickOpts.count,
          maxDigits: this._maxDigits(),
          horizontal: this.isHorizontal(),
          minRotation: tickOpts.minRotation || 0,
          includeBounds: tickOpts.includeBounds !== false
        };
        const dataRange = this._range || this;
        const ticks = generateTicks$1(numericGeneratorOptions, dataRange);
        if (opts.bounds === 'ticks') {
          _setMinAndMaxByKey(ticks, this, 'value');
        }
        if (opts.reverse) {
          ticks.reverse();
          this.start = this.max;
          this.end = this.min;
        } else {
          this.start = this.min;
          this.end = this.max;
        }
        return ticks;
      }
      configure() {
        const ticks = this.ticks;
        let start = this.min;
        let end = this.max;
        super.configure();
        if (this.options.offset && ticks.length) {
          const offset = (end - start) / Math.max(ticks.length - 1, 1) / 2;
          start -= offset;
          end += offset;
        }
        this._startValue = start;
        this._endValue = end;
        this._valueRange = end - start;
      }
      getLabelForValue(value) {
        return formatNumber(value, this.chart.options.locale);
      }
    }

    class LinearScale extends LinearScaleBase {
      determineDataLimits() {
        const {min, max} = this.getMinMax(true);
        this.min = isNumberFinite(min) ? min : 0;
        this.max = isNumberFinite(max) ? max : 1;
        this.handleTickRangeOptions();
      }
      computeTickLimit() {
        const horizontal = this.isHorizontal();
        const length = horizontal ? this.width : this.height;
        const minRotation = toRadians(this.options.ticks.minRotation);
        const ratio = (horizontal ? Math.sin(minRotation) : Math.cos(minRotation)) || 0.001;
        const tickFont = this._resolveTickFontOptions(0);
        return Math.ceil(length / Math.min(40, tickFont.lineHeight / ratio));
      }
      getPixelForValue(value) {
        return value === null ? NaN : this.getPixelForDecimal((value - this._startValue) / this._valueRange);
      }
      getValueForPixel(pixel) {
        return this._startValue + this.getDecimalForPixel(pixel) * this._valueRange;
      }
    }
    LinearScale.id = 'linear';
    LinearScale.defaults = {
      ticks: {
        callback: Ticks.formatters.numeric
      }
    };

    function isMajor(tickVal) {
      const remain = tickVal / (Math.pow(10, Math.floor(log10(tickVal))));
      return remain === 1;
    }
    function generateTicks(generationOptions, dataRange) {
      const endExp = Math.floor(log10(dataRange.max));
      const endSignificand = Math.ceil(dataRange.max / Math.pow(10, endExp));
      const ticks = [];
      let tickVal = finiteOrDefault(generationOptions.min, Math.pow(10, Math.floor(log10(dataRange.min))));
      let exp = Math.floor(log10(tickVal));
      let significand = Math.floor(tickVal / Math.pow(10, exp));
      let precision = exp < 0 ? Math.pow(10, Math.abs(exp)) : 1;
      do {
        ticks.push({value: tickVal, major: isMajor(tickVal)});
        ++significand;
        if (significand === 10) {
          significand = 1;
          ++exp;
          precision = exp >= 0 ? 1 : precision;
        }
        tickVal = Math.round(significand * Math.pow(10, exp) * precision) / precision;
      } while (exp < endExp || (exp === endExp && significand < endSignificand));
      const lastTick = finiteOrDefault(generationOptions.max, tickVal);
      ticks.push({value: lastTick, major: isMajor(tickVal)});
      return ticks;
    }
    class LogarithmicScale extends Scale {
      constructor(cfg) {
        super(cfg);
        this.start = undefined;
        this.end = undefined;
        this._startValue = undefined;
        this._valueRange = 0;
      }
      parse(raw, index) {
        const value = LinearScaleBase.prototype.parse.apply(this, [raw, index]);
        if (value === 0) {
          this._zero = true;
          return undefined;
        }
        return isNumberFinite(value) && value > 0 ? value : null;
      }
      determineDataLimits() {
        const {min, max} = this.getMinMax(true);
        this.min = isNumberFinite(min) ? Math.max(0, min) : null;
        this.max = isNumberFinite(max) ? Math.max(0, max) : null;
        if (this.options.beginAtZero) {
          this._zero = true;
        }
        this.handleTickRangeOptions();
      }
      handleTickRangeOptions() {
        const {minDefined, maxDefined} = this.getUserBounds();
        let min = this.min;
        let max = this.max;
        const setMin = v => (min = minDefined ? min : v);
        const setMax = v => (max = maxDefined ? max : v);
        const exp = (v, m) => Math.pow(10, Math.floor(log10(v)) + m);
        if (min === max) {
          if (min <= 0) {
            setMin(1);
            setMax(10);
          } else {
            setMin(exp(min, -1));
            setMax(exp(max, +1));
          }
        }
        if (min <= 0) {
          setMin(exp(max, -1));
        }
        if (max <= 0) {
          setMax(exp(min, +1));
        }
        if (this._zero && this.min !== this._suggestedMin && min === exp(this.min, 0)) {
          setMin(exp(min, -1));
        }
        this.min = min;
        this.max = max;
      }
      buildTicks() {
        const opts = this.options;
        const generationOptions = {
          min: this._userMin,
          max: this._userMax
        };
        const ticks = generateTicks(generationOptions, this);
        if (opts.bounds === 'ticks') {
          _setMinAndMaxByKey(ticks, this, 'value');
        }
        if (opts.reverse) {
          ticks.reverse();
          this.start = this.max;
          this.end = this.min;
        } else {
          this.start = this.min;
          this.end = this.max;
        }
        return ticks;
      }
      getLabelForValue(value) {
        return value === undefined ? '0' : formatNumber(value, this.chart.options.locale);
      }
      configure() {
        const start = this.min;
        super.configure();
        this._startValue = log10(start);
        this._valueRange = log10(this.max) - log10(start);
      }
      getPixelForValue(value) {
        if (value === undefined || value === 0) {
          value = this.min;
        }
        if (value === null || isNaN(value)) {
          return NaN;
        }
        return this.getPixelForDecimal(value === this.min
          ? 0
          : (log10(value) - this._startValue) / this._valueRange);
      }
      getValueForPixel(pixel) {
        const decimal = this.getDecimalForPixel(pixel);
        return Math.pow(10, this._startValue + decimal * this._valueRange);
      }
    }
    LogarithmicScale.id = 'logarithmic';
    LogarithmicScale.defaults = {
      ticks: {
        callback: Ticks.formatters.logarithmic,
        major: {
          enabled: true
        }
      }
    };

    function getTickBackdropHeight(opts) {
      const tickOpts = opts.ticks;
      if (tickOpts.display && opts.display) {
        const padding = toPadding(tickOpts.backdropPadding);
        return valueOrDefault(tickOpts.font && tickOpts.font.size, defaults.font.size) + padding.height;
      }
      return 0;
    }
    function measureLabelSize(ctx, font, label) {
      label = isArray(label) ? label : [label];
      return {
        w: _longestText(ctx, font.string, label),
        h: label.length * font.lineHeight
      };
    }
    function determineLimits(angle, pos, size, min, max) {
      if (angle === min || angle === max) {
        return {
          start: pos - (size / 2),
          end: pos + (size / 2)
        };
      } else if (angle < min || angle > max) {
        return {
          start: pos - size,
          end: pos
        };
      }
      return {
        start: pos,
        end: pos + size
      };
    }
    function fitWithPointLabels(scale) {
      const furthestLimits = {
        l: 0,
        r: scale.width,
        t: 0,
        b: scale.height - scale.paddingTop
      };
      const furthestAngles = {};
      const labelSizes = [];
      const padding = [];
      const valueCount = scale.getLabels().length;
      for (let i = 0; i < valueCount; i++) {
        const opts = scale.options.pointLabels.setContext(scale.getPointLabelContext(i));
        padding[i] = opts.padding;
        const pointPosition = scale.getPointPosition(i, scale.drawingArea + padding[i]);
        const plFont = toFont(opts.font);
        const textSize = measureLabelSize(scale.ctx, plFont, scale._pointLabels[i]);
        labelSizes[i] = textSize;
        const angleRadians = scale.getIndexAngle(i);
        const angle = toDegrees(angleRadians);
        const hLimits = determineLimits(angle, pointPosition.x, textSize.w, 0, 180);
        const vLimits = determineLimits(angle, pointPosition.y, textSize.h, 90, 270);
        if (hLimits.start < furthestLimits.l) {
          furthestLimits.l = hLimits.start;
          furthestAngles.l = angleRadians;
        }
        if (hLimits.end > furthestLimits.r) {
          furthestLimits.r = hLimits.end;
          furthestAngles.r = angleRadians;
        }
        if (vLimits.start < furthestLimits.t) {
          furthestLimits.t = vLimits.start;
          furthestAngles.t = angleRadians;
        }
        if (vLimits.end > furthestLimits.b) {
          furthestLimits.b = vLimits.end;
          furthestAngles.b = angleRadians;
        }
      }
      scale._setReductions(scale.drawingArea, furthestLimits, furthestAngles);
      scale._pointLabelItems = buildPointLabelItems(scale, labelSizes, padding);
    }
    function buildPointLabelItems(scale, labelSizes, padding) {
      const items = [];
      const valueCount = scale.getLabels().length;
      const opts = scale.options;
      const tickBackdropHeight = getTickBackdropHeight(opts);
      const outerDistance = scale.getDistanceFromCenterForValue(opts.ticks.reverse ? scale.min : scale.max);
      for (let i = 0; i < valueCount; i++) {
        const extra = (i === 0 ? tickBackdropHeight / 2 : 0);
        const pointLabelPosition = scale.getPointPosition(i, outerDistance + extra + padding[i]);
        const angle = toDegrees(scale.getIndexAngle(i));
        const size = labelSizes[i];
        const y = yForAngle(pointLabelPosition.y, size.h, angle);
        const textAlign = getTextAlignForAngle(angle);
        const left = leftForTextAlign(pointLabelPosition.x, size.w, textAlign);
        items.push({
          x: pointLabelPosition.x,
          y,
          textAlign,
          left,
          top: y,
          right: left + size.w,
          bottom: y + size.h
        });
      }
      return items;
    }
    function getTextAlignForAngle(angle) {
      if (angle === 0 || angle === 180) {
        return 'center';
      } else if (angle < 180) {
        return 'left';
      }
      return 'right';
    }
    function leftForTextAlign(x, w, align) {
      if (align === 'right') {
        x -= w;
      } else if (align === 'center') {
        x -= (w / 2);
      }
      return x;
    }
    function yForAngle(y, h, angle) {
      if (angle === 90 || angle === 270) {
        y -= (h / 2);
      } else if (angle > 270 || angle < 90) {
        y -= h;
      }
      return y;
    }
    function drawPointLabels(scale, labelCount) {
      const {ctx, options: {pointLabels}} = scale;
      for (let i = labelCount - 1; i >= 0; i--) {
        const optsAtIndex = pointLabels.setContext(scale.getPointLabelContext(i));
        const plFont = toFont(optsAtIndex.font);
        const {x, y, textAlign, left, top, right, bottom} = scale._pointLabelItems[i];
        const {backdropColor} = optsAtIndex;
        if (!isNullOrUndef(backdropColor)) {
          const padding = toPadding(optsAtIndex.backdropPadding);
          ctx.fillStyle = backdropColor;
          ctx.fillRect(left - padding.left, top - padding.top, right - left + padding.width, bottom - top + padding.height);
        }
        renderText(
          ctx,
          scale._pointLabels[i],
          x,
          y + (plFont.lineHeight / 2),
          plFont,
          {
            color: optsAtIndex.color,
            textAlign: textAlign,
            textBaseline: 'middle'
          }
        );
      }
    }
    function pathRadiusLine(scale, radius, circular, labelCount) {
      const {ctx} = scale;
      if (circular) {
        ctx.arc(scale.xCenter, scale.yCenter, radius, 0, TAU);
      } else {
        let pointPosition = scale.getPointPosition(0, radius);
        ctx.moveTo(pointPosition.x, pointPosition.y);
        for (let i = 1; i < labelCount; i++) {
          pointPosition = scale.getPointPosition(i, radius);
          ctx.lineTo(pointPosition.x, pointPosition.y);
        }
      }
    }
    function drawRadiusLine(scale, gridLineOpts, radius, labelCount) {
      const ctx = scale.ctx;
      const circular = gridLineOpts.circular;
      const {color, lineWidth} = gridLineOpts;
      if ((!circular && !labelCount) || !color || !lineWidth || radius < 0) {
        return;
      }
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.setLineDash(gridLineOpts.borderDash);
      ctx.lineDashOffset = gridLineOpts.borderDashOffset;
      ctx.beginPath();
      pathRadiusLine(scale, radius, circular, labelCount);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    function numberOrZero(param) {
      return isNumber(param) ? param : 0;
    }
    function createPointLabelContext(parent, index, label) {
      return createContext(parent, {
        label,
        index,
        type: 'pointLabel'
      });
    }
    class RadialLinearScale extends LinearScaleBase {
      constructor(cfg) {
        super(cfg);
        this.xCenter = undefined;
        this.yCenter = undefined;
        this.drawingArea = undefined;
        this._pointLabels = [];
        this._pointLabelItems = [];
      }
      setDimensions() {
        this.width = this.maxWidth;
        this.height = this.maxHeight;
        this.paddingTop = getTickBackdropHeight(this.options) / 2;
        this.xCenter = Math.floor(this.width / 2);
        this.yCenter = Math.floor((this.height - this.paddingTop) / 2);
        this.drawingArea = Math.min(this.height - this.paddingTop, this.width) / 2;
      }
      determineDataLimits() {
        const {min, max} = this.getMinMax(false);
        this.min = isNumberFinite(min) && !isNaN(min) ? min : 0;
        this.max = isNumberFinite(max) && !isNaN(max) ? max : 0;
        this.handleTickRangeOptions();
      }
      computeTickLimit() {
        return Math.ceil(this.drawingArea / getTickBackdropHeight(this.options));
      }
      generateTickLabels(ticks) {
        LinearScaleBase.prototype.generateTickLabels.call(this, ticks);
        this._pointLabels = this.getLabels().map((value, index) => {
          const label = callback(this.options.pointLabels.callback, [value, index], this);
          return label || label === 0 ? label : '';
        });
      }
      fit() {
        const opts = this.options;
        if (opts.display && opts.pointLabels.display) {
          fitWithPointLabels(this);
        } else {
          this.setCenterPoint(0, 0, 0, 0);
        }
      }
      _setReductions(largestPossibleRadius, furthestLimits, furthestAngles) {
        let radiusReductionLeft = furthestLimits.l / Math.sin(furthestAngles.l);
        let radiusReductionRight = Math.max(furthestLimits.r - this.width, 0) / Math.sin(furthestAngles.r);
        let radiusReductionTop = -furthestLimits.t / Math.cos(furthestAngles.t);
        let radiusReductionBottom = -Math.max(furthestLimits.b - (this.height - this.paddingTop), 0) / Math.cos(furthestAngles.b);
        radiusReductionLeft = numberOrZero(radiusReductionLeft);
        radiusReductionRight = numberOrZero(radiusReductionRight);
        radiusReductionTop = numberOrZero(radiusReductionTop);
        radiusReductionBottom = numberOrZero(radiusReductionBottom);
        this.drawingArea = Math.max(largestPossibleRadius / 2, Math.min(
          Math.floor(largestPossibleRadius - (radiusReductionLeft + radiusReductionRight) / 2),
          Math.floor(largestPossibleRadius - (radiusReductionTop + radiusReductionBottom) / 2)));
        this.setCenterPoint(radiusReductionLeft, radiusReductionRight, radiusReductionTop, radiusReductionBottom);
      }
      setCenterPoint(leftMovement, rightMovement, topMovement, bottomMovement) {
        const maxRight = this.width - rightMovement - this.drawingArea;
        const maxLeft = leftMovement + this.drawingArea;
        const maxTop = topMovement + this.drawingArea;
        const maxBottom = (this.height - this.paddingTop) - bottomMovement - this.drawingArea;
        this.xCenter = Math.floor(((maxLeft + maxRight) / 2) + this.left);
        this.yCenter = Math.floor(((maxTop + maxBottom) / 2) + this.top + this.paddingTop);
      }
      getIndexAngle(index) {
        const angleMultiplier = TAU / this.getLabels().length;
        const startAngle = this.options.startAngle || 0;
        return _normalizeAngle(index * angleMultiplier + toRadians(startAngle));
      }
      getDistanceFromCenterForValue(value) {
        if (isNullOrUndef(value)) {
          return NaN;
        }
        const scalingFactor = this.drawingArea / (this.max - this.min);
        if (this.options.reverse) {
          return (this.max - value) * scalingFactor;
        }
        return (value - this.min) * scalingFactor;
      }
      getValueForDistanceFromCenter(distance) {
        if (isNullOrUndef(distance)) {
          return NaN;
        }
        const scaledDistance = distance / (this.drawingArea / (this.max - this.min));
        return this.options.reverse ? this.max - scaledDistance : this.min + scaledDistance;
      }
      getPointLabelContext(index) {
        const pointLabels = this._pointLabels || [];
        if (index >= 0 && index < pointLabels.length) {
          const pointLabel = pointLabels[index];
          return createPointLabelContext(this.getContext(), index, pointLabel);
        }
      }
      getPointPosition(index, distanceFromCenter) {
        const angle = this.getIndexAngle(index) - HALF_PI;
        return {
          x: Math.cos(angle) * distanceFromCenter + this.xCenter,
          y: Math.sin(angle) * distanceFromCenter + this.yCenter,
          angle
        };
      }
      getPointPositionForValue(index, value) {
        return this.getPointPosition(index, this.getDistanceFromCenterForValue(value));
      }
      getBasePosition(index) {
        return this.getPointPositionForValue(index || 0, this.getBaseValue());
      }
      getPointLabelPosition(index) {
        const {left, top, right, bottom} = this._pointLabelItems[index];
        return {
          left,
          top,
          right,
          bottom,
        };
      }
      drawBackground() {
        const {backgroundColor, grid: {circular}} = this.options;
        if (backgroundColor) {
          const ctx = this.ctx;
          ctx.save();
          ctx.beginPath();
          pathRadiusLine(this, this.getDistanceFromCenterForValue(this._endValue), circular, this.getLabels().length);
          ctx.closePath();
          ctx.fillStyle = backgroundColor;
          ctx.fill();
          ctx.restore();
        }
      }
      drawGrid() {
        const ctx = this.ctx;
        const opts = this.options;
        const {angleLines, grid} = opts;
        const labelCount = this.getLabels().length;
        let i, offset, position;
        if (opts.pointLabels.display) {
          drawPointLabels(this, labelCount);
        }
        if (grid.display) {
          this.ticks.forEach((tick, index) => {
            if (index !== 0) {
              offset = this.getDistanceFromCenterForValue(tick.value);
              const optsAtIndex = grid.setContext(this.getContext(index - 1));
              drawRadiusLine(this, optsAtIndex, offset, labelCount);
            }
          });
        }
        if (angleLines.display) {
          ctx.save();
          for (i = this.getLabels().length - 1; i >= 0; i--) {
            const optsAtIndex = angleLines.setContext(this.getPointLabelContext(i));
            const {color, lineWidth} = optsAtIndex;
            if (!lineWidth || !color) {
              continue;
            }
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.setLineDash(optsAtIndex.borderDash);
            ctx.lineDashOffset = optsAtIndex.borderDashOffset;
            offset = this.getDistanceFromCenterForValue(opts.ticks.reverse ? this.min : this.max);
            position = this.getPointPosition(i, offset);
            ctx.beginPath();
            ctx.moveTo(this.xCenter, this.yCenter);
            ctx.lineTo(position.x, position.y);
            ctx.stroke();
          }
          ctx.restore();
        }
      }
      drawBorder() {}
      drawLabels() {
        const ctx = this.ctx;
        const opts = this.options;
        const tickOpts = opts.ticks;
        if (!tickOpts.display) {
          return;
        }
        const startAngle = this.getIndexAngle(0);
        let offset, width;
        ctx.save();
        ctx.translate(this.xCenter, this.yCenter);
        ctx.rotate(startAngle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.ticks.forEach((tick, index) => {
          if (index === 0 && !opts.reverse) {
            return;
          }
          const optsAtIndex = tickOpts.setContext(this.getContext(index));
          const tickFont = toFont(optsAtIndex.font);
          offset = this.getDistanceFromCenterForValue(this.ticks[index].value);
          if (optsAtIndex.showLabelBackdrop) {
            ctx.font = tickFont.string;
            width = ctx.measureText(tick.label).width;
            ctx.fillStyle = optsAtIndex.backdropColor;
            const padding = toPadding(optsAtIndex.backdropPadding);
            ctx.fillRect(
              -width / 2 - padding.left,
              -offset - tickFont.size / 2 - padding.top,
              width + padding.width,
              tickFont.size + padding.height
            );
          }
          renderText(ctx, tick.label, 0, -offset, tickFont, {
            color: optsAtIndex.color,
          });
        });
        ctx.restore();
      }
      drawTitle() {}
    }
    RadialLinearScale.id = 'radialLinear';
    RadialLinearScale.defaults = {
      display: true,
      animate: true,
      position: 'chartArea',
      angleLines: {
        display: true,
        lineWidth: 1,
        borderDash: [],
        borderDashOffset: 0.0
      },
      grid: {
        circular: false
      },
      startAngle: 0,
      ticks: {
        showLabelBackdrop: true,
        callback: Ticks.formatters.numeric
      },
      pointLabels: {
        backdropColor: undefined,
        backdropPadding: 2,
        display: true,
        font: {
          size: 10
        },
        callback(label) {
          return label;
        },
        padding: 5
      }
    };
    RadialLinearScale.defaultRoutes = {
      'angleLines.color': 'borderColor',
      'pointLabels.color': 'color',
      'ticks.color': 'color'
    };
    RadialLinearScale.descriptors = {
      angleLines: {
        _fallback: 'grid'
      }
    };

    const INTERVALS = {
      millisecond: {common: true, size: 1, steps: 1000},
      second: {common: true, size: 1000, steps: 60},
      minute: {common: true, size: 60000, steps: 60},
      hour: {common: true, size: 3600000, steps: 24},
      day: {common: true, size: 86400000, steps: 30},
      week: {common: false, size: 604800000, steps: 4},
      month: {common: true, size: 2.628e9, steps: 12},
      quarter: {common: false, size: 7.884e9, steps: 4},
      year: {common: true, size: 3.154e10}
    };
    const UNITS = (Object.keys(INTERVALS));
    function sorter(a, b) {
      return a - b;
    }
    function parse(scale, input) {
      if (isNullOrUndef(input)) {
        return null;
      }
      const adapter = scale._adapter;
      const {parser, round, isoWeekday} = scale._parseOpts;
      let value = input;
      if (typeof parser === 'function') {
        value = parser(value);
      }
      if (!isNumberFinite(value)) {
        value = typeof parser === 'string'
          ? adapter.parse(value, parser)
          : adapter.parse(value);
      }
      if (value === null) {
        return null;
      }
      if (round) {
        value = round === 'week' && (isNumber(isoWeekday) || isoWeekday === true)
          ? adapter.startOf(value, 'isoWeek', isoWeekday)
          : adapter.startOf(value, round);
      }
      return +value;
    }
    function determineUnitForAutoTicks(minUnit, min, max, capacity) {
      const ilen = UNITS.length;
      for (let i = UNITS.indexOf(minUnit); i < ilen - 1; ++i) {
        const interval = INTERVALS[UNITS[i]];
        const factor = interval.steps ? interval.steps : Number.MAX_SAFE_INTEGER;
        if (interval.common && Math.ceil((max - min) / (factor * interval.size)) <= capacity) {
          return UNITS[i];
        }
      }
      return UNITS[ilen - 1];
    }
    function determineUnitForFormatting(scale, numTicks, minUnit, min, max) {
      for (let i = UNITS.length - 1; i >= UNITS.indexOf(minUnit); i--) {
        const unit = UNITS[i];
        if (INTERVALS[unit].common && scale._adapter.diff(max, min, unit) >= numTicks - 1) {
          return unit;
        }
      }
      return UNITS[minUnit ? UNITS.indexOf(minUnit) : 0];
    }
    function determineMajorUnit(unit) {
      for (let i = UNITS.indexOf(unit) + 1, ilen = UNITS.length; i < ilen; ++i) {
        if (INTERVALS[UNITS[i]].common) {
          return UNITS[i];
        }
      }
    }
    function addTick(ticks, time, timestamps) {
      if (!timestamps) {
        ticks[time] = true;
      } else if (timestamps.length) {
        const {lo, hi} = _lookup(timestamps, time);
        const timestamp = timestamps[lo] >= time ? timestamps[lo] : timestamps[hi];
        ticks[timestamp] = true;
      }
    }
    function setMajorTicks(scale, ticks, map, majorUnit) {
      const adapter = scale._adapter;
      const first = +adapter.startOf(ticks[0].value, majorUnit);
      const last = ticks[ticks.length - 1].value;
      let major, index;
      for (major = first; major <= last; major = +adapter.add(major, 1, majorUnit)) {
        index = map[major];
        if (index >= 0) {
          ticks[index].major = true;
        }
      }
      return ticks;
    }
    function ticksFromTimestamps(scale, values, majorUnit) {
      const ticks = [];
      const map = {};
      const ilen = values.length;
      let i, value;
      for (i = 0; i < ilen; ++i) {
        value = values[i];
        map[value] = i;
        ticks.push({
          value,
          major: false
        });
      }
      return (ilen === 0 || !majorUnit) ? ticks : setMajorTicks(scale, ticks, map, majorUnit);
    }
    class TimeScale extends Scale {
      constructor(props) {
        super(props);
        this._cache = {
          data: [],
          labels: [],
          all: []
        };
        this._unit = 'day';
        this._majorUnit = undefined;
        this._offsets = {};
        this._normalized = false;
        this._parseOpts = undefined;
      }
      init(scaleOpts, opts) {
        const time = scaleOpts.time || (scaleOpts.time = {});
        const adapter = this._adapter = new adapters._date(scaleOpts.adapters.date);
        mergeIf(time.displayFormats, adapter.formats());
        this._parseOpts = {
          parser: time.parser,
          round: time.round,
          isoWeekday: time.isoWeekday
        };
        super.init(scaleOpts);
        this._normalized = opts.normalized;
      }
      parse(raw, index) {
        if (raw === undefined) {
          return null;
        }
        return parse(this, raw);
      }
      beforeLayout() {
        super.beforeLayout();
        this._cache = {
          data: [],
          labels: [],
          all: []
        };
      }
      determineDataLimits() {
        const options = this.options;
        const adapter = this._adapter;
        const unit = options.time.unit || 'day';
        let {min, max, minDefined, maxDefined} = this.getUserBounds();
        function _applyBounds(bounds) {
          if (!minDefined && !isNaN(bounds.min)) {
            min = Math.min(min, bounds.min);
          }
          if (!maxDefined && !isNaN(bounds.max)) {
            max = Math.max(max, bounds.max);
          }
        }
        if (!minDefined || !maxDefined) {
          _applyBounds(this._getLabelBounds());
          if (options.bounds !== 'ticks' || options.ticks.source !== 'labels') {
            _applyBounds(this.getMinMax(false));
          }
        }
        min = isNumberFinite(min) && !isNaN(min) ? min : +adapter.startOf(Date.now(), unit);
        max = isNumberFinite(max) && !isNaN(max) ? max : +adapter.endOf(Date.now(), unit) + 1;
        this.min = Math.min(min, max - 1);
        this.max = Math.max(min + 1, max);
      }
      _getLabelBounds() {
        const arr = this.getLabelTimestamps();
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        if (arr.length) {
          min = arr[0];
          max = arr[arr.length - 1];
        }
        return {min, max};
      }
      buildTicks() {
        const options = this.options;
        const timeOpts = options.time;
        const tickOpts = options.ticks;
        const timestamps = tickOpts.source === 'labels' ? this.getLabelTimestamps() : this._generate();
        if (options.bounds === 'ticks' && timestamps.length) {
          this.min = this._userMin || timestamps[0];
          this.max = this._userMax || timestamps[timestamps.length - 1];
        }
        const min = this.min;
        const max = this.max;
        const ticks = _filterBetween(timestamps, min, max);
        this._unit = timeOpts.unit || (tickOpts.autoSkip
          ? determineUnitForAutoTicks(timeOpts.minUnit, this.min, this.max, this._getLabelCapacity(min))
          : determineUnitForFormatting(this, ticks.length, timeOpts.minUnit, this.min, this.max));
        this._majorUnit = !tickOpts.major.enabled || this._unit === 'year' ? undefined
          : determineMajorUnit(this._unit);
        this.initOffsets(timestamps);
        if (options.reverse) {
          ticks.reverse();
        }
        return ticksFromTimestamps(this, ticks, this._majorUnit);
      }
      initOffsets(timestamps) {
        let start = 0;
        let end = 0;
        let first, last;
        if (this.options.offset && timestamps.length) {
          first = this.getDecimalForValue(timestamps[0]);
          if (timestamps.length === 1) {
            start = 1 - first;
          } else {
            start = (this.getDecimalForValue(timestamps[1]) - first) / 2;
          }
          last = this.getDecimalForValue(timestamps[timestamps.length - 1]);
          if (timestamps.length === 1) {
            end = last;
          } else {
            end = (last - this.getDecimalForValue(timestamps[timestamps.length - 2])) / 2;
          }
        }
        const limit = timestamps.length < 3 ? 0.5 : 0.25;
        start = _limitValue(start, 0, limit);
        end = _limitValue(end, 0, limit);
        this._offsets = {start, end, factor: 1 / (start + 1 + end)};
      }
      _generate() {
        const adapter = this._adapter;
        const min = this.min;
        const max = this.max;
        const options = this.options;
        const timeOpts = options.time;
        const minor = timeOpts.unit || determineUnitForAutoTicks(timeOpts.minUnit, min, max, this._getLabelCapacity(min));
        const stepSize = valueOrDefault(timeOpts.stepSize, 1);
        const weekday = minor === 'week' ? timeOpts.isoWeekday : false;
        const hasWeekday = isNumber(weekday) || weekday === true;
        const ticks = {};
        let first = min;
        let time, count;
        if (hasWeekday) {
          first = +adapter.startOf(first, 'isoWeek', weekday);
        }
        first = +adapter.startOf(first, hasWeekday ? 'day' : minor);
        if (adapter.diff(max, min, minor) > 100000 * stepSize) {
          throw new Error(min + ' and ' + max + ' are too far apart with stepSize of ' + stepSize + ' ' + minor);
        }
        const timestamps = options.ticks.source === 'data' && this.getDataTimestamps();
        for (time = first, count = 0; time < max; time = +adapter.add(time, stepSize, minor), count++) {
          addTick(ticks, time, timestamps);
        }
        if (time === max || options.bounds === 'ticks' || count === 1) {
          addTick(ticks, time, timestamps);
        }
        return Object.keys(ticks).sort((a, b) => a - b).map(x => +x);
      }
      getLabelForValue(value) {
        const adapter = this._adapter;
        const timeOpts = this.options.time;
        if (timeOpts.tooltipFormat) {
          return adapter.format(value, timeOpts.tooltipFormat);
        }
        return adapter.format(value, timeOpts.displayFormats.datetime);
      }
      _tickFormatFunction(time, index, ticks, format) {
        const options = this.options;
        const formats = options.time.displayFormats;
        const unit = this._unit;
        const majorUnit = this._majorUnit;
        const minorFormat = unit && formats[unit];
        const majorFormat = majorUnit && formats[majorUnit];
        const tick = ticks[index];
        const major = majorUnit && majorFormat && tick && tick.major;
        const label = this._adapter.format(time, format || (major ? majorFormat : minorFormat));
        const formatter = options.ticks.callback;
        return formatter ? callback(formatter, [label, index, ticks], this) : label;
      }
      generateTickLabels(ticks) {
        let i, ilen, tick;
        for (i = 0, ilen = ticks.length; i < ilen; ++i) {
          tick = ticks[i];
          tick.label = this._tickFormatFunction(tick.value, i, ticks);
        }
      }
      getDecimalForValue(value) {
        return value === null ? NaN : (value - this.min) / (this.max - this.min);
      }
      getPixelForValue(value) {
        const offsets = this._offsets;
        const pos = this.getDecimalForValue(value);
        return this.getPixelForDecimal((offsets.start + pos) * offsets.factor);
      }
      getValueForPixel(pixel) {
        const offsets = this._offsets;
        const pos = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
        return this.min + pos * (this.max - this.min);
      }
      _getLabelSize(label) {
        const ticksOpts = this.options.ticks;
        const tickLabelWidth = this.ctx.measureText(label).width;
        const angle = toRadians(this.isHorizontal() ? ticksOpts.maxRotation : ticksOpts.minRotation);
        const cosRotation = Math.cos(angle);
        const sinRotation = Math.sin(angle);
        const tickFontSize = this._resolveTickFontOptions(0).size;
        return {
          w: (tickLabelWidth * cosRotation) + (tickFontSize * sinRotation),
          h: (tickLabelWidth * sinRotation) + (tickFontSize * cosRotation)
        };
      }
      _getLabelCapacity(exampleTime) {
        const timeOpts = this.options.time;
        const displayFormats = timeOpts.displayFormats;
        const format = displayFormats[timeOpts.unit] || displayFormats.millisecond;
        const exampleLabel = this._tickFormatFunction(exampleTime, 0, ticksFromTimestamps(this, [exampleTime], this._majorUnit), format);
        const size = this._getLabelSize(exampleLabel);
        const capacity = Math.floor(this.isHorizontal() ? this.width / size.w : this.height / size.h) - 1;
        return capacity > 0 ? capacity : 1;
      }
      getDataTimestamps() {
        let timestamps = this._cache.data || [];
        let i, ilen;
        if (timestamps.length) {
          return timestamps;
        }
        const metas = this.getMatchingVisibleMetas();
        if (this._normalized && metas.length) {
          return (this._cache.data = metas[0].controller.getAllParsedValues(this));
        }
        for (i = 0, ilen = metas.length; i < ilen; ++i) {
          timestamps = timestamps.concat(metas[i].controller.getAllParsedValues(this));
        }
        return (this._cache.data = this.normalize(timestamps));
      }
      getLabelTimestamps() {
        const timestamps = this._cache.labels || [];
        let i, ilen;
        if (timestamps.length) {
          return timestamps;
        }
        const labels = this.getLabels();
        for (i = 0, ilen = labels.length; i < ilen; ++i) {
          timestamps.push(parse(this, labels[i]));
        }
        return (this._cache.labels = this._normalized ? timestamps : this.normalize(timestamps));
      }
      normalize(values) {
        return _arrayUnique(values.sort(sorter));
      }
    }
    TimeScale.id = 'time';
    TimeScale.defaults = {
      bounds: 'data',
      adapters: {},
      time: {
        parser: false,
        unit: false,
        round: false,
        isoWeekday: false,
        minUnit: 'millisecond',
        displayFormats: {}
      },
      ticks: {
        source: 'auto',
        major: {
          enabled: false
        }
      }
    };

    function interpolate(table, val, reverse) {
      let lo = 0;
      let hi = table.length - 1;
      let prevSource, nextSource, prevTarget, nextTarget;
      if (reverse) {
        if (val >= table[lo].pos && val <= table[hi].pos) {
          ({lo, hi} = _lookupByKey(table, 'pos', val));
        }
        ({pos: prevSource, time: prevTarget} = table[lo]);
        ({pos: nextSource, time: nextTarget} = table[hi]);
      } else {
        if (val >= table[lo].time && val <= table[hi].time) {
          ({lo, hi} = _lookupByKey(table, 'time', val));
        }
        ({time: prevSource, pos: prevTarget} = table[lo]);
        ({time: nextSource, pos: nextTarget} = table[hi]);
      }
      const span = nextSource - prevSource;
      return span ? prevTarget + (nextTarget - prevTarget) * (val - prevSource) / span : prevTarget;
    }
    class TimeSeriesScale extends TimeScale {
      constructor(props) {
        super(props);
        this._table = [];
        this._minPos = undefined;
        this._tableRange = undefined;
      }
      initOffsets() {
        const timestamps = this._getTimestampsForTable();
        const table = this._table = this.buildLookupTable(timestamps);
        this._minPos = interpolate(table, this.min);
        this._tableRange = interpolate(table, this.max) - this._minPos;
        super.initOffsets(timestamps);
      }
      buildLookupTable(timestamps) {
        const {min, max} = this;
        const items = [];
        const table = [];
        let i, ilen, prev, curr, next;
        for (i = 0, ilen = timestamps.length; i < ilen; ++i) {
          curr = timestamps[i];
          if (curr >= min && curr <= max) {
            items.push(curr);
          }
        }
        if (items.length < 2) {
          return [
            {time: min, pos: 0},
            {time: max, pos: 1}
          ];
        }
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          next = items[i + 1];
          prev = items[i - 1];
          curr = items[i];
          if (Math.round((next + prev) / 2) !== curr) {
            table.push({time: curr, pos: i / (ilen - 1)});
          }
        }
        return table;
      }
      _getTimestampsForTable() {
        let timestamps = this._cache.all || [];
        if (timestamps.length) {
          return timestamps;
        }
        const data = this.getDataTimestamps();
        const label = this.getLabelTimestamps();
        if (data.length && label.length) {
          timestamps = this.normalize(data.concat(label));
        } else {
          timestamps = data.length ? data : label;
        }
        timestamps = this._cache.all = timestamps;
        return timestamps;
      }
      getDecimalForValue(value) {
        return (interpolate(this._table, value) - this._minPos) / this._tableRange;
      }
      getValueForPixel(pixel) {
        const offsets = this._offsets;
        const decimal = this.getDecimalForPixel(pixel) / offsets.factor - offsets.end;
        return interpolate(this._table, decimal * this._tableRange + this._minPos, true);
      }
    }
    TimeSeriesScale.id = 'timeseries';
    TimeSeriesScale.defaults = TimeScale.defaults;

    var scales = /*#__PURE__*/Object.freeze({
    __proto__: null,
    CategoryScale: CategoryScale,
    LinearScale: LinearScale,
    LogarithmicScale: LogarithmicScale,
    RadialLinearScale: RadialLinearScale,
    TimeScale: TimeScale,
    TimeSeriesScale: TimeSeriesScale
    });

    const registerables = [
      controllers,
      elements,
      plugins,
      scales,
    ];

    Chart.register(...registerables);

    class HomePage extends NavElement {
        constructor() {
            super();
        }
        firstUpdated() {
            const ctx ='myChart2';    
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
                    datasets: [{
                        label: '# of Votes',
                        data: [12, 19, 3, 5, 2, 3],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 206, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                            'rgba(153, 102, 255, 0.2)',
                            'rgba(255, 159, 64, 0.2)'
                        ],
                        borderColor: [
                            'rgba(255,99,132,1)',
                            'rgba(54, 162, 235, 1)',
                            'rgba(255, 206, 86, 1)',
                            'rgba(75, 192, 192, 1)',
                            'rgba(153, 102, 255, 1)',
                            'rgba(255, 159, 64, 1)'
                        ],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: false,
                    maintainAspectRatio: true,
                    scales: {
                        y: {                        
                                beginAtZero:true                        
                        }
                    }
                }
            });
          }
        render() {
            return p` 
            <br>
            <div class = " columns is-centered is-full ">
                <div class = " column is-11 ">
                    <h1  class = " title is-size-2 has-text-centered has-text-dark is-italic has-text-weight-bold ">GESTIONE GALLERIA</h1>
                </div> 
            </div>
            <br>
            <div class = " columns  is-centered is-full ">
                <div class = " column is-3 ">
                    <h1  class = " title is-size-3 has-text-centered has-text-dark is-italic has-text-weight-bold ">STATISTICHE</h1>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">Auto in questo momento</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>                    
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">tasso di cooupazione</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">tempo di percorrenza</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">limite di velocità</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">lunghezza</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">2</h1>
                        </div>
                    </div>
                    <hr>
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-9 ">
                            <h1  class = " title is-size-5 has-text-left has-text-dark is-italic has-text-weight-bold ">tasso di occupazione medio periodo</h1>
                        </div>
                        <div class = " column is-2 ">
                            <h1  class = " title is-size-5 has-text-centered has-text-dark is-italic has-text-weight-bold ">3</h1>
                        </div>
                    </div>
                    <hr> 
                    <div class = " columns  is-centered is-full ">
                        <div class = " column is-5 ">
                            <button route = "/prova" class="button is-dark">CONFERMA</button>
                        </div>
                    </div>
                </div> 

                <div class = " column is-9 ">
                    <h1  class = " title is-size-3 has-text-centered has-text-dark is-italic has-text-weight-bold ">GRAFICO</h1>
                    <div>
                        <canvas id="myChart2" style=" background-color:rgb(250,250,250) " width="400" height="400"></canvas>
                    </div>
                </div>
            </div>
            
        `;
        }
             
    }


    customElements.define('home-page', HomePage);

    class RouterComponent extends HTMLElement {

        constructor() {
            super();
            this.routes = [
                { path: '/', element: 'home-page' , description: "Home"},
                { path: '/prova', element: 'prova-page' , description: "Prova" },
                //{ path: '/list-page' , element: 'list-page' , description: "Lista"},
                //{ path: '/remove-page' , element: 'remove-page' , description: "Elimina"},

            ];

            //aggiungo un listener per quando si preme i tasti avanti e indietro nel browser
            window.addEventListener('popstate', () => this.navigate(document.location.pathname, false));
            window.addEventListener('navigate', (e) => this.navigate(e.detail, true));
            //chiamo navigate anche al primo avvio della pagina
            this.navigate(document.location.pathname, true);
        }

        //imposta a tutti i pulsanti con l'attributo route un listener a navigate
        setListenerToActiveRoutes() {
            let activeRoutes = Array.from(this.querySelectorAll('[route]'));
            activeRoutes.forEach(activeRoute => {
                activeRoute.addEventListener('click', () => {
                    this.navigate(activeRoute.attributes.route.value, true);
                });
            });
        }

        /*path è il percorso a cui si vuole andare, pushState indica se si deve fare il push nella history
        pushState = false nel listener a popstate altrimenti tasto back non funziona*/
        navigate(path, pushState) {
            //ottengo la rotta corretta
            let route = this.routes.find(item => item.path === path);
            if (route) {
                    //cambio la pagina a seconda del path
                    const newElement = document.createElement(route.element);
                    while (this.firstChild) {
                        this.removeChild(this.firstChild);
                    }
                    this.appendChild(newElement);

                    /*chiamo la funzione setListener solo dopo timeout di 0 ms,
                    in caso contario non si rilevano <button>, perchè appendChild() asincrona                
                    */
                    setTimeout(() => {
                        this.setListenerToActiveRoutes();
                    }, 0);
                    document.title = 'Galleria - ' + route.description;
                    if (pushState) {
                        history.pushState({}, '', route.path);
                    }
            }
            else {
                console.log ("ERROR 404 PAGE NOT FOUND");
                this.navigate('/', true);
            }
        }
    }

    customElements.define('router-component', RouterComponent);

})();
